import { sqlite } from "../db.ts";
import { getLLMConfig, callLLM } from "./llm.ts";
import { listAgents, createAgent, getAgent } from "./agents.ts";
import { getCredentials, handleIntegrationProxy } from "./integrations.ts";
import type { ChatMessage } from "../types.ts";

// ─── Constants ────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const DEFAULT_SYSTEM_PROMPT =
  "You are an AI assistant for AIHive Command Center, a marketing and sales platform. " +
  "You can analyze data, create agents, and execute tasks across integrations.";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function rowToConversation(
  columns: string[],
  row: any[]
): { id: string; messages: ChatMessage[]; agent_id?: string; workspace?: string } {
  const obj: Record<string, any> = {};
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = row[i];
  }

  let messages: ChatMessage[] = [];
  if (obj.messages) {
    try {
      messages = JSON.parse(obj.messages);
    } catch {
      messages = [];
    }
  }

  return {
    id: obj.id,
    messages,
    agent_id: obj.agent_id ?? undefined,
    workspace: obj.workspace ?? undefined,
  };
}

// ─── Conversation DB ops ──────────────────────────────────────────────────────

async function loadConversation(
  conversationId: string
): Promise<{ id: string; messages: ChatMessage[]; agent_id?: string; workspace?: string } | null> {
  const result = await sqlite.execute(
    "SELECT id, messages, agent_id, workspace FROM conversations WHERE id = ?",
    [conversationId]
  );

  if (!result.rows || result.rows.length === 0) {
    return null;
  }

  return rowToConversation(result.columns, result.rows[0]);
}

async function saveConversation(
  id: string,
  messages: ChatMessage[],
  agentId?: string,
  workspace?: string
): Promise<void> {
  const now = new Date().toISOString();
  const messagesJson = JSON.stringify(messages);

  const existing = await sqlite.execute(
    "SELECT id FROM conversations WHERE id = ?",
    [id]
  );

  if (existing.rows && existing.rows.length > 0) {
    await sqlite.execute(
      "UPDATE conversations SET messages = ?, agent_id = ?, workspace = ?, updated_at = ? WHERE id = ?",
      [messagesJson, agentId ?? null, workspace ?? null, now, id]
    );
  } else {
    await sqlite.execute(
      `INSERT INTO conversations (id, messages, agent_id, workspace, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, messagesJson, agentId ?? null, workspace ?? null, now, now]
    );
  }
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

function buildTools(): any[] {
  return [
    {
      type: "function",
      function: {
        name: "get_integration_data",
        description:
          "Fetch data from a connected external integration such as Ahrefs, GA4, GSC, LinkedIn, Outlook, WordPress, YouTube, or Product Hunt.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "Integration name: ahrefs, ga4, gsc, linkedin, outlook, wordpress, youtube, producthunt",
            },
            endpoint: {
              type: "string",
              description:
                "The endpoint to call within the integration (e.g. 'site-explorer', 'keywords', 'messages', 'posts')",
            },
            params: {
              type: "object",
              description: "Additional query parameters to forward to the API",
              additionalProperties: { type: "string" },
            },
          },
          required: ["name", "endpoint"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_agent",
        description:
          "Create a new AI agent in AIHive Command Center with a specific role, workspace, and toolset.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name for the new agent",
            },
            workspace: {
              type: "string",
              enum: ["marketing", "sales"],
              description: "The workspace this agent belongs to",
            },
            description: {
              type: "string",
              description: "Short description of what this agent does",
            },
            system_prompt: {
              type: "string",
              description: "System prompt that defines the agent's behavior",
            },
            tools: {
              type: "array",
              items: { type: "string" },
              description:
                "List of tool names the agent has access to (e.g. ['get_integration_data', 'compose_content'])",
            },
          },
          required: ["name", "workspace", "description", "system_prompt", "tools"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "list_agents",
        description: "List all AI agents, optionally filtered by workspace.",
        parameters: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              enum: ["marketing", "sales"],
              description: "Filter agents by workspace (optional)",
            },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "compose_content",
        description:
          "Generate marketing or sales content such as blog posts, LinkedIn updates, emails, or YouTube descriptions.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["blog", "linkedin", "email", "youtube_description"],
              description: "The type of content to generate",
            },
            topic: {
              type: "string",
              description: "The topic or subject of the content",
            },
            tone: {
              type: "string",
              description:
                "The tone of voice for the content (e.g. 'professional', 'casual', 'persuasive')",
            },
          },
          required: ["type", "topic"],
        },
      },
    },
  ];
}

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolArgs: Record<string, any>,
  llmConfig: Awaited<ReturnType<typeof getLLMConfig>>
): Promise<string> {
  switch (toolName) {
    case "get_integration_data": {
      const { name, endpoint, params = {} } = toolArgs as {
        name: string;
        endpoint: string;
        params?: Record<string, string>;
      };

      const creds = await getCredentials(name);
      if (!creds) {
        return JSON.stringify({
          error: `Integration '${name}' is not configured. Please add credentials first.`,
        });
      }

      // Build a synthetic URLSearchParams from args
      const searchParams = new URLSearchParams({ endpoint });
      for (const [k, v] of Object.entries(params)) {
        searchParams.set(k, String(v));
      }

      // Build a minimal Request so handlers can read body if needed
      const syntheticReq = new Request("https://aihive.internal/proxy", {
        method: "GET",
      });

      try {
        const proxyRes = await handleIntegrationProxy(
          syntheticReq,
          name,
          searchParams,
          creds
        );
        const data = await proxyRes.json();
        return JSON.stringify(data);
      } catch (err: any) {
        return JSON.stringify({ error: err?.message ?? "Proxy request failed" });
      }
    }

    case "create_agent": {
      const { name, workspace, description, system_prompt, tools } = toolArgs as {
        name: string;
        workspace: "marketing" | "sales";
        description: string;
        system_prompt: string;
        tools: string[];
      };

      try {
        const agent = await createAgent({
          name,
          workspace,
          description,
          system_prompt,
          tools,
        });
        return JSON.stringify({ success: true, agent });
      } catch (err: any) {
        return JSON.stringify({ error: err?.message ?? "Failed to create agent" });
      }
    }

    case "list_agents": {
      const { workspace } = toolArgs as { workspace?: string };
      try {
        const agents = await listAgents(workspace);
        return JSON.stringify({ agents });
      } catch (err: any) {
        return JSON.stringify({ error: err?.message ?? "Failed to list agents" });
      }
    }

    case "compose_content": {
      const { type, topic, tone = "professional" } = toolArgs as {
        type: "blog" | "linkedin" | "email" | "youtube_description";
        topic: string;
        tone?: string;
      };

      const contentPrompts: Record<string, string> = {
        blog: `Write a comprehensive, SEO-friendly blog post about: "${topic}". Tone: ${tone}. Include an introduction, 3-5 sections with headers, and a conclusion.`,
        linkedin: `Write an engaging LinkedIn post about: "${topic}". Tone: ${tone}. Keep it under 300 words, include relevant hashtags, and a call-to-action.`,
        email: `Write a professional email about: "${topic}". Tone: ${tone}. Include subject line, greeting, body paragraphs, and a clear call-to-action.`,
        youtube_description: `Write an optimized YouTube video description for a video about: "${topic}". Tone: ${tone}. Include a hook, timestamps placeholder, links section, and relevant tags.`,
      };

      const prompt = contentPrompts[type] ?? `Write content about: "${topic}". Tone: ${tone}.`;

      try {
        const contentMessages: ChatMessage[] = [
          { role: "user", content: prompt },
        ];

        const result = await callLLM(llmConfig, contentMessages, {
          systemPrompt:
            "You are an expert content writer for marketing and sales teams. Produce high-quality, engaging content tailored to the specified format and tone.",
          maxTokens: 2048,
        });

        return JSON.stringify({
          type,
          topic,
          tone,
          content: result.content,
        });
      } catch (err: any) {
        return JSON.stringify({ error: err?.message ?? "Failed to compose content" });
      }
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ─── Main chat handler ────────────────────────────────────────────────────────

export async function handleChat(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    message,
    agent_id,
    conversation_id: incomingConversationId,
    workspace,
  } = body as {
    message?: string;
    agent_id?: string;
    conversation_id?: string;
    workspace?: string;
  };

  if (!message || typeof message !== "string" || message.trim() === "") {
    return json({ error: "message field is required and must be a non-empty string" }, 400);
  }

  // Load LLM config
  const llmConfig = await getLLMConfig();

  // Load agent if specified
  let agent = null;
  if (agent_id) {
    agent = await getAgent(agent_id);
  }

  // Determine conversation ID
  const conversationId = incomingConversationId ?? crypto.randomUUID();

  // Load existing conversation history or start fresh
  let conversationHistory: ChatMessage[] = [];
  if (incomingConversationId) {
    const existing = await loadConversation(incomingConversationId);
    if (existing) {
      conversationHistory = existing.messages;
    }
  }

  // Add the new user message
  conversationHistory.push({ role: "user", content: message.trim() });

  // Build system prompt
  const systemPrompt: string =
    agent?.system_prompt?.trim()
      ? agent.system_prompt.trim()
      : DEFAULT_SYSTEM_PROMPT;

  // Determine tools — use agent's tools list if specified, else full toolset
  let tools = buildTools();
  if (agent?.tools) {
    let agentToolNames: string[] = [];
    try { agentToolNames = JSON.parse(agent.tools); } catch { agentToolNames = []; }
    if (agentToolNames.length > 0) {
      tools = tools.filter((t) => agentToolNames.includes(t.function.name));
    }
  }

  // First LLM call
  let llmResult = await callLLM(llmConfig, conversationHistory, {
    systemPrompt,
    tools,
    maxTokens: 4096,
  });

  const allToolCalls: any[] = [];

  // Handle one round of tool use
  if (llmResult.tool_calls && llmResult.tool_calls.length > 0) {
    // Record the assistant message with tool calls
    conversationHistory.push({
      role: "assistant",
      content: llmResult.content || "",
      tool_calls: llmResult.tool_calls,
    } as any);

    // Execute each tool call and collect results
    const toolResults: Array<{ tool_call_id: string; role: "tool"; content: string }> = [];

    for (const toolCall of llmResult.tool_calls) {
      allToolCalls.push(toolCall);

      let args: Record<string, any> = {};
      try {
        args =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments ?? {};
      } catch {
        args = {};
      }

      const toolResult = await executeTool(toolCall.function.name, args, llmConfig);

      toolResults.push({
        tool_call_id: toolCall.id,
        role: "tool",
        content: toolResult,
      });
    }

    // Add tool results to history
    for (const tr of toolResults) {
      conversationHistory.push(tr as any);
    }

    // Second LLM call with tool results
    llmResult = await callLLM(llmConfig, conversationHistory, {
      systemPrompt,
      tools,
      maxTokens: 4096,
    });
  }

  // Add final assistant response to history
  conversationHistory.push({
    role: "assistant",
    content: llmResult.content,
  });

  // Persist conversation
  await saveConversation(
    conversationId,
    conversationHistory,
    agent_id,
    workspace
  );

  return json({
    response: llmResult.content,
    conversation_id: conversationId,
    tool_calls: allToolCalls.length > 0 ? allToolCalls : undefined,
    agent_id: agent_id ?? undefined,
  });
}
