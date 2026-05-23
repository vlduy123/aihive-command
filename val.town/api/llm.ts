import { sqlite } from "../db.ts";
import type { LLMConfig, ChatMessage } from "../types.ts";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: LLMConfig = {
  id: "default",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  api_key: "",
  endpoint: "",
  max_tokens: 4096,
  temperature: 0.7,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToConfig(columns: string[], row: any[]): LLMConfig {
  const obj: Record<string, any> = {};
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = row[i];
  }
  return {
    id: obj.id ?? "default",
    provider: obj.provider ?? DEFAULT_CONFIG.provider,
    model: obj.model ?? DEFAULT_CONFIG.model,
    api_key: obj.api_key ?? "",
    endpoint: obj.endpoint ?? "",
    max_tokens: obj.max_tokens ?? DEFAULT_CONFIG.max_tokens,
    temperature: obj.temperature ?? DEFAULT_CONFIG.temperature,
  } as LLMConfig;
}

// ─── DB operations ────────────────────────────────────────────────────────────

export async function getLLMConfig(): Promise<LLMConfig> {
  const result = await sqlite.execute(
    "SELECT id, provider, model, api_key, endpoint, max_tokens, temperature FROM llm_config WHERE id = 'default'",
    []
  );

  if (!result.rows || result.rows.length === 0) {
    return { ...DEFAULT_CONFIG };
  }

  return rowToConfig(result.columns, result.rows[0]);
}

export async function saveLLMConfig(
  config: Partial<LLMConfig>
): Promise<LLMConfig> {
  const existing = await getLLMConfig();

  const merged: LLMConfig = {
    id: "default",
    provider: config.provider ?? existing.provider,
    model: config.model ?? existing.model,
    api_key: config.api_key ?? existing.api_key,
    endpoint: config.endpoint ?? existing.endpoint,
    max_tokens: config.max_tokens ?? existing.max_tokens,
    temperature: config.temperature ?? existing.temperature,
  };

  await sqlite.execute(
    `INSERT OR REPLACE INTO llm_config (id, provider, model, api_key, endpoint, max_tokens, temperature)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      merged.id,
      merged.provider,
      merged.model,
      merged.api_key,
      merged.endpoint,
      merged.max_tokens,
      merged.temperature,
    ]
  );

  return merged;
}

// ─── LLM call ─────────────────────────────────────────────────────────────────

export async function callLLM(
  config: LLMConfig,
  messages: ChatMessage[],
  options?: {
    systemPrompt?: string;
    tools?: any[];
    maxTokens?: number;
  }
): Promise<{ content: string; tool_calls?: any[] }> {
  const maxTokens = options?.maxTokens ?? config.max_tokens ?? 4096;
  const systemPrompt = options?.systemPrompt;
  const tools = options?.tools;

  if (config.provider === "anthropic") {
    return callAnthropic(config, messages, systemPrompt, tools, maxTokens);
  } else if (config.provider === "openai") {
    return callOpenAI(
      config,
      "https://api.openai.com/v1",
      messages,
      systemPrompt,
      tools,
      maxTokens
    );
  } else if (config.provider === "custom") {
    const endpoint = config.endpoint?.replace(/\/+$/, "") ?? "";
    return callOpenAI(
      config,
      endpoint,
      messages,
      systemPrompt,
      tools,
      maxTokens
    );
  } else {
    throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function callAnthropic(
  config: LLMConfig,
  messages: ChatMessage[],
  systemPrompt?: string,
  tools?: any[],
  maxTokens = 4096
): Promise<{ content: string; tool_calls?: any[] }> {
  const body: Record<string, any> = {
    model: config.model ?? "claude-sonnet-4-6",
    max_tokens: maxTokens,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  if (tools && tools.length > 0) {
    // Convert OpenAI-style tools to Anthropic format if needed
    body.tools = tools.map((t) => {
      if (t.type === "function") {
        return {
          name: t.function.name,
          description: t.function.description ?? "",
          input_schema: t.function.parameters ?? { type: "object", properties: {} },
        };
      }
      // Already in Anthropic format
      return t;
    });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.api_key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Extract text content and tool use blocks
  let textContent = "";
  const toolCalls: any[] = [];

  if (Array.isArray(data.content)) {
    for (const block of data.content) {
      if (block.type === "text") {
        textContent += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }
  }

  return {
    content: textContent,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

// ─── OpenAI / OpenAI-compatible ──────────────────────────────────────────────

async function callOpenAI(
  config: LLMConfig,
  baseUrl: string,
  messages: ChatMessage[],
  systemPrompt?: string,
  tools?: any[],
  maxTokens = 4096
): Promise<{ content: string; tool_calls?: any[] }> {
  const openAIMessages: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    openAIMessages.push({ role: "system", content: systemPrompt });
  }

  for (const m of messages) {
    openAIMessages.push({ role: m.role, content: m.content });
  }

  const body: Record<string, any> = {
    model: config.model ?? "gpt-4o",
    messages: openAIMessages,
    max_tokens: maxTokens,
    temperature: config.temperature ?? 0.7,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  const content: string = message?.content ?? "";
  const tool_calls: any[] | undefined =
    message?.tool_calls && message.tool_calls.length > 0
      ? message.tool_calls
      : undefined;

  return { content, tool_calls };
}
