import { sqlite as _sqlite } from "https://esm.town/v/std/sqlite";

// Compatibility shim: support sqlite.execute(sql, args) two-arg form
// Val.town's libSQL client only accepts execute(string) or execute({sql, args})
const _exec = _sqlite.execute.bind(_sqlite);
export const sqlite = {
  ..._sqlite,
  execute: async (stmt: string | { sql: string; args?: any[] }, args?: any[]): Promise<any> => {
    if (typeof stmt === "string" && args !== undefined) {
      return _exec({ sql: stmt, args });
    }
    return _exec(stmt as any);
  },
};

export async function initDB() {
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      api_key TEXT,
      api_secret TEXT,
      access_token TEXT,
      refresh_token TEXT,
      extra_config TEXT,
      connected_at TEXT,
      updated_at TEXT
    )
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS llm_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      provider TEXT NOT NULL DEFAULT 'anthropic',
      api_key TEXT NOT NULL DEFAULT '',
      endpoint TEXT,
      model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
      updated_at TEXT
    )
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      workspace TEXT NOT NULL,
      description TEXT,
      system_prompt TEXT,
      tools TEXT DEFAULT '[]',
      model TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT DEFAULT 'user'
    )
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      workspace TEXT NOT NULL,
      messages TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      workspace TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      input TEXT,
      output TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    )
  `);

  // Seed default LLM config if not exists
  const existing = await sqlite.execute("SELECT id FROM llm_config WHERE id = 'default'");
  if (existing.rows.length === 0) {
    await sqlite.execute(
      "INSERT INTO llm_config (id, provider, api_key, model, updated_at) VALUES ('default', 'anthropic', '', 'claude-sonnet-4-6', ?)",
      [new Date().toISOString()]
    );
  }

  // Seed default agents
  await seedDefaultAgents();
}

async function seedDefaultAgents() {
  const existing = await sqlite.execute("SELECT id FROM agents LIMIT 1");
  if (existing.rows.length > 0) return;

  const now = new Date().toISOString();
  const defaultAgents = [
    {
      id: crypto.randomUUID(),
      name: "SEO Analyst",
      workspace: "marketing",
      description: "Analyzes SEO performance using Ahrefs and Google Search Console data",
      system_prompt: "You are an expert SEO analyst. Analyze search performance data, identify opportunities, and provide actionable recommendations to improve organic search rankings.",
      tools: JSON.stringify(["ahrefs", "gsc", "ga4"]),
      model: "claude-sonnet-4-6",
      created_by: "user"
    },
    {
      id: crypto.randomUUID(),
      name: "Content Creator",
      workspace: "marketing",
      description: "Creates and manages content for WordPress, YouTube, and social media",
      system_prompt: "You are a creative content strategist. Help plan, write, and optimize content for blogs, videos, and social media platforms to drive engagement and conversions.",
      tools: JSON.stringify(["wordpress", "youtube", "ga4"]),
      model: "claude-sonnet-4-6",
      created_by: "user"
    },
    {
      id: crypto.randomUUID(),
      name: "Analytics Reporter",
      workspace: "marketing",
      description: "Generates reports from GA4 and Search Console data",
      system_prompt: "You are a data analyst specializing in digital marketing analytics. Create insightful reports from GA4 and Search Console data to track KPIs and identify growth opportunities.",
      tools: JSON.stringify(["ga4", "gsc", "ahrefs"]),
      model: "claude-sonnet-4-6",
      created_by: "user"
    },
    {
      id: crypto.randomUUID(),
      name: "LinkedIn Outreach",
      workspace: "sales",
      description: "Manages LinkedIn prospecting and connection campaigns",
      system_prompt: "You are a sales development expert specializing in LinkedIn outreach. Help craft personalized connection requests, follow-up messages, and engagement strategies to build pipeline.",
      tools: JSON.stringify(["linkedin", "outlook"]),
      model: "claude-sonnet-4-6",
      created_by: "user"
    },
    {
      id: crypto.randomUUID(),
      name: "Lead Researcher",
      workspace: "sales",
      description: "Researches prospects using LinkedIn and web data",
      system_prompt: "You are a research specialist who finds and qualifies sales leads. Analyze LinkedIn profiles, company data, and online presence to identify ideal prospects and gather intelligence for sales outreach.",
      tools: JSON.stringify(["linkedin"]),
      model: "claude-sonnet-4-6",
      created_by: "user"
    },
    {
      id: crypto.randomUUID(),
      name: "Email Composer",
      workspace: "sales",
      description: "Drafts and sends personalized sales emails via Outlook",
      system_prompt: "You are a sales email expert who crafts compelling, personalized outreach emails. Write emails that are concise, value-focused, and drive response rates while maintaining brand voice.",
      tools: JSON.stringify(["outlook", "linkedin"]),
      model: "claude-sonnet-4-6",
      created_by: "user"
    }
  ];

  for (const agent of defaultAgents) {
    await sqlite.execute(
      `INSERT INTO agents (id, name, workspace, description, system_prompt, tools, model, enabled, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [agent.id, agent.name, agent.workspace, agent.description, agent.system_prompt, agent.tools, agent.model, now, now, agent.created_by]
    );
  }
}

