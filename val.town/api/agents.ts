import { sqlite } from "../db.ts";
import type { Agent } from "../types.ts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToAgent(columns: string[], row: any[]): Agent {
  const obj: Record<string, any> = {};
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = row[i];
  }

  let tools: string[] = [];
  if (obj.tools) {
    try {
      tools = JSON.parse(obj.tools);
    } catch {
      tools = [];
    }
  }

  let metadata: Record<string, any> | undefined;
  if (obj.metadata) {
    try {
      metadata = JSON.parse(obj.metadata);
    } catch {
      metadata = undefined;
    }
  }

  return {
    id: obj.id,
    name: obj.name,
    workspace: obj.workspace,
    description: obj.description ?? undefined,
    system_prompt: obj.system_prompt ?? undefined,
    tools,
    status: obj.status ?? "idle",
    metadata,
    created_at: obj.created_at,
    updated_at: obj.updated_at,
  } as Agent;
}

// ─── CRUD functions ───────────────────────────────────────────────────────────

export async function listAgents(workspace?: string): Promise<Agent[]> {
  let query: string;
  let args: any[];

  if (workspace) {
    query =
      "SELECT id, name, workspace, description, system_prompt, tools, status, metadata, created_at, updated_at FROM agents WHERE workspace = ? ORDER BY name ASC";
    args = [workspace];
  } else {
    query =
      "SELECT id, name, workspace, description, system_prompt, tools, status, metadata, created_at, updated_at FROM agents ORDER BY name ASC";
    args = [];
  }

  const result = await sqlite.execute(query, args);

  if (!result.rows || result.rows.length === 0) {
    return [];
  }

  return result.rows.map((row) => rowToAgent(result.columns, row));
}

export async function getAgent(id: string): Promise<Agent | null> {
  const result = await sqlite.execute(
    "SELECT id, name, workspace, description, system_prompt, tools, status, metadata, created_at, updated_at FROM agents WHERE id = ?",
    [id]
  );

  if (!result.rows || result.rows.length === 0) {
    return null;
  }

  return rowToAgent(result.columns, result.rows[0]);
}

export async function createAgent(data: Partial<Agent>): Promise<Agent> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const name = data.name ?? "Unnamed Agent";
  const workspace = data.workspace ?? "marketing";
  const description = data.description ?? null;
  const system_prompt = data.system_prompt ?? null;
  const tools = data.tools ? JSON.stringify(data.tools) : JSON.stringify([]);
  const status = data.status ?? "idle";
  const metadata = data.metadata ? JSON.stringify(data.metadata) : null;

  await sqlite.execute(
    `INSERT INTO agents (id, name, workspace, description, system_prompt, tools, status, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, workspace, description, system_prompt, tools, status, metadata, now, now]
  );

  const created = await getAgent(id);
  if (!created) {
    throw new Error(`Failed to retrieve agent after creation (id=${id})`);
  }
  return created;
}

export async function updateAgent(
  id: string,
  data: Partial<Agent>
): Promise<Agent | null> {
  const existing = await getAgent(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();

  const name = data.name ?? existing.name;
  const workspace = data.workspace ?? existing.workspace;
  const description =
    "description" in data ? (data.description ?? null) : (existing.description ?? null);
  const system_prompt =
    "system_prompt" in data
      ? (data.system_prompt ?? null)
      : (existing.system_prompt ?? null);
  const tools =
    "tools" in data
      ? JSON.stringify(data.tools ?? [])
      : JSON.stringify(existing.tools ?? []);
  const status = data.status ?? existing.status ?? "idle";
  const metadata =
    "metadata" in data
      ? data.metadata
        ? JSON.stringify(data.metadata)
        : null
      : existing.metadata
      ? JSON.stringify(existing.metadata)
      : null;

  await sqlite.execute(
    `UPDATE agents
     SET name = ?, workspace = ?, description = ?, system_prompt = ?, tools = ?, status = ?, metadata = ?, updated_at = ?
     WHERE id = ?`,
    [name, workspace, description, system_prompt, tools, status, metadata, now, id]
  );

  return getAgent(id);
}

export async function deleteAgent(id: string): Promise<boolean> {
  const existing = await getAgent(id);
  if (!existing) {
    return false;
  }

  await sqlite.execute("DELETE FROM agents WHERE id = ?", [id]);
  return true;
}
