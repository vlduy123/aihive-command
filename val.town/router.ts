import { sqlite, initDB } from "./db.ts";
import { listAgents, createAgent, updateAgent, deleteAgent } from "./api/agents.ts";
import { getLLMConfig, saveLLMConfig } from "./api/llm.ts";
import { handleChat } from "./api/chat.ts";
import { handleIntegrationProxy, getCredentials } from "./api/integrations.ts";
import { getAppJS } from "./frontend_js.ts";
import { getChartsJS } from "./frontend_charts.ts";
import { getUIJS } from "./frontend_ui.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export async function handleRequest(req: Request, url: URL): Promise<Response> {
  const { pathname } = url;
  const method = req.method;

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // GET /api/health
    if (pathname === "/api/health" && method === "GET") {
      return json({ status: "ok", timestamp: new Date().toISOString() });
    }

    // GET /api/app-js — serve React application JavaScript
    if (pathname === "/api/app-js" && method === "GET") {
      return new Response(getAppJS(), {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          ...corsHeaders,
        },
      });
    }

    // GET /api/app-charts — serve chart components as ES module
    if (pathname === "/api/app-charts" && method === "GET") {
      return new Response(getChartsJS(), {
        headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache, no-store, must-revalidate", ...corsHeaders },
      });
    }

    // GET /api/app-ui — serve UI primitives as ES module
    if (pathname === "/api/app-ui" && method === "GET") {
      return new Response(getUIJS(), {
        headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache, no-store, must-revalidate", ...corsHeaders },
      });
    }

    // Integrations routes
    // GET /api/integrations — list all integrations
    if (pathname === "/api/integrations" && method === "GET") {
      const result = await sqlite.execute("SELECT * FROM integrations ORDER BY name ASC");
      const integrations = result.rows.map((row) => {
        const obj = rowToObject(result.columns, row);
        let extra_config: Record<string, any> | null = null;
        if (obj.extra_config) {
          try { extra_config = JSON.parse(String(obj.extra_config)); } catch { extra_config = null; }
        }
        return {
          ...obj,
          connected: !!(obj.api_key || obj.access_token),
          api_key: obj.api_key ? String(obj.api_key).slice(0, 4) + "***" : undefined,
          access_token: obj.access_token ? "***" : undefined,
          extra_config,
        };
      });
      return json(integrations);
    }

    // POST /api/integrations/:name — upsert integration credentials
    const integrationUpsertMatch = pathname.match(/^\/api\/integrations\/([^/]+)$/);
    if (integrationUpsertMatch && method === "POST") {
      const name = integrationUpsertMatch[1];
      const body = await req.json().catch(() => ({}));
      const now = new Date().toISOString();

      const existing = await sqlite.execute(
        "SELECT id, api_key, api_secret, access_token, refresh_token, extra_config FROM integrations WHERE name = ?",
        [name]
      );

      // Helper: update field if a new non-empty value provided; explicit null clears the field.
      const pick = (newVal: any, existingVal: any) => {
        if (newVal === null) return null;          // explicit null = clear
        if (newVal === undefined || newVal === "") return existingVal ?? null; // omitted = keep existing
        return newVal;
      };

      // Helper: merge extra_config objects
      const mergeEC = (newEC: any, existingRaw: any): string | null => {
        const existing = existingRaw ? (() => { try { return JSON.parse(String(existingRaw)); } catch { return {}; } })() : {};
        if (newEC == null) return existingRaw ?? null;
        const merged = { ...existing, ...newEC };
        // Remove keys explicitly set to null/empty
        Object.keys(merged).forEach(k => { if (merged[k] === null || merged[k] === "") delete merged[k]; });
        return Object.keys(merged).length ? JSON.stringify(merged) : null;
      };

      if (existing.rows.length > 0) {
        const [, exKey, exSec, exToken, exRefresh, exEC] = existing.rows[0] as any[];
        await sqlite.execute(
          `UPDATE integrations SET api_key=?,api_secret=?,access_token=?,refresh_token=?,extra_config=?,updated_at=? WHERE name=?`,
          [
            pick(body.api_key, exKey),
            pick(body.api_secret, exSec),
            pick(body.access_token, exToken),
            pick(body.refresh_token, exRefresh),
            mergeEC(body.extra_config, exEC),
            now,
            name,
          ]
        );
      } else {
        // Insert
        const id = crypto.randomUUID();
        await sqlite.execute(
          `INSERT INTO integrations (id, name, api_key, api_secret, access_token, refresh_token, extra_config, connected_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            name,
            body.api_key || null,
            body.api_secret || null,
            body.access_token || null,
            body.refresh_token || null,
            body.extra_config != null ? JSON.stringify(body.extra_config) : null,
            now,
            now,
          ]
        );
      }

      const updated = await sqlite.execute(
        "SELECT * FROM integrations WHERE name = ?",
        [name]
      );
      const integration = rowToObject(updated.columns, updated.rows[0]);
      return json({ success: true, integration });
    }

    // DELETE /api/integrations/:name
    const integrationDeleteMatch = pathname.match(/^\/api\/integrations\/([^/]+)$/);
    if (integrationDeleteMatch && method === "DELETE") {
      const name = integrationDeleteMatch[1];
      await sqlite.execute("DELETE FROM integrations WHERE name = ?", [name]);
      return json({ success: true, message: `Integration '${name}' deleted` });
    }

    // GET|POST /api/integrations/:name/data — proxy to integration API
    const integrationDataMatch = pathname.match(/^\/api\/integrations\/([^/]+)\/data$/);
    if (integrationDataMatch && (method === "GET" || method === "POST")) {
      const name = integrationDataMatch[1];
      const credentials = await getCredentials(name);
      if (!credentials) {
        return json({ error: `Integration '${name}' not found or not configured` }, 404);
      }
      return handleIntegrationProxy(req, name, url.searchParams, credentials);
    }

    // Agents routes
    // GET /api/agents — list agents (optional ?workspace= query param)
    if (pathname === "/api/agents" && method === "GET") {
      const workspace = url.searchParams.get("workspace") ?? undefined;
      const agents = await listAgents(workspace);
      return json(agents);
    }

    // POST /api/agents — create agent
    if (pathname === "/api/agents" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const agent = await createAgent(body);
      return json(agent, 201);
    }

    // PUT /api/agents/:id — update agent
    const agentUpdateMatch = pathname.match(/^\/api\/agents\/([^/]+)$/);
    if (agentUpdateMatch && method === "PUT") {
      const id = agentUpdateMatch[1];
      const body = await req.json().catch(() => ({}));
      const agent = await updateAgent(id, body);
      if (!agent) {
        return json({ error: `Agent '${id}' not found` }, 404);
      }
      return json(agent);
    }

    // DELETE /api/agents/:id — delete agent
    const agentDeleteMatch = pathname.match(/^\/api\/agents\/([^/]+)$/);
    if (agentDeleteMatch && method === "DELETE") {
      const id = agentDeleteMatch[1];
      const deleted = await deleteAgent(id);
      if (!deleted) {
        return json({ error: `Agent '${id}' not found` }, 404);
      }
      return json({ success: true, message: `Agent '${id}' deleted` });
    }

    // LLM config routes
    // GET /api/llm/config — get LLM config (mask api_key)
    if (pathname === "/api/llm/config" && method === "GET") {
      const config = await getLLMConfig();
      if (!config) {
        return json({ error: "LLM config not found" }, 404);
      }
      // Mask api_key: show first 8 chars + ***
      const masked = {
        ...config,
        api_key: config.api_key
          ? config.api_key.slice(0, 8) + "***"
          : "",
      };
      return json(masked);
    }

    // POST /api/llm/config — save LLM config
    if (pathname === "/api/llm/config" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const config = await saveLLMConfig(body);
      // Mask api_key in response
      const masked = {
        ...config,
        api_key: config.api_key
          ? config.api_key.slice(0, 8) + "***"
          : "",
      };
      return json(masked);
    }

    // Chat route
    // POST /api/chat — AI chat handler
    if (pathname === "/api/chat" && method === "POST") {
      return handleChat(req);
    }

    // Tasks routes
    // GET /api/tasks — list tasks (optional ?workspace= query param)
    if (pathname === "/api/tasks" && method === "GET") {
      const workspace = url.searchParams.get("workspace");
      let result;
      if (workspace) {
        result = await sqlite.execute(
          "SELECT * FROM tasks WHERE workspace = ? ORDER BY created_at DESC",
          [workspace]
        );
      } else {
        result = await sqlite.execute(
          "SELECT * FROM tasks ORDER BY created_at DESC"
        );
      }
      const tasks = result.rows.map((row) => rowToObject(result.columns, row));
      return json(tasks);
    }

    // ─── Google OAuth 2.0 flow ──────────────────────────────────────────────
    // GET /api/auth/google — redirect user to Google consent screen
    if (pathname === "/api/auth/google" && method === "GET") {
      const creds = await getCredentials("google");
      const clientId = creds?.extra_config?.client_id ?? "";
      const clientSecret = creds?.api_secret ?? "";
      if (!clientId || !clientSecret) {
        return new Response(
          "Save your Google Client ID and Client Secret in Settings first, then try again.",
          { status: 400, headers: { "Content-Type": "text/plain" } }
        );
      }
      // Use the explicitly stored redirect URI — must match exactly what's in Google Cloud Console.
      const redirectUri = creds?.extra_config?.redirect_uri ?? `${url.origin}/api/auth/google/callback`;
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/youtube.readonly",
        "openid", "email",
      ].join(" ");
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      return new Response(null, { status: 302, headers: { Location: authUrl.toString() } });
    }

    // GET /api/auth/google/callback — exchange code for tokens, store, redirect home
    if (pathname === "/api/auth/google/callback" && method === "GET") {
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      if (error || !code) {
        return new Response(null, { status: 302, headers: { Location: `/?auth_error=${error ?? "no_code"}` } });
      }
      const creds = await getCredentials("google");
      const clientId = creds?.extra_config?.client_id ?? "";
      const clientSecret = creds?.api_secret ?? "";
      const redirectUri = creds?.extra_config?.redirect_uri ?? `${url.origin}/api/auth/google/callback`;
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const tokens = await tokenRes.json();
      if (tokens.access_token) {
        const now = new Date().toISOString();
        const existing = await sqlite.execute("SELECT id FROM integrations WHERE name='google'");
        if (existing.rows.length > 0) {
          await sqlite.execute(
            "UPDATE integrations SET access_token=?, refresh_token=?, updated_at=? WHERE name='google'",
            [tokens.access_token, tokens.refresh_token ?? creds?.refresh_token ?? null, now]
          );
        } else {
          await sqlite.execute(
            "INSERT INTO integrations (id,name,access_token,refresh_token,api_key,api_secret,extra_config,connected_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
            [crypto.randomUUID(), "google", tokens.access_token, tokens.refresh_token ?? null, null, clientSecret, JSON.stringify({ client_id: clientId }), now, now]
          );
        }
        return new Response(null, { status: 302, headers: { Location: "/?auth=google_ok" } });
      }
      return new Response(null, { status: 302, headers: { Location: `/?auth_error=token_exchange_failed` } });
    }

    // No route matched
    return json({ error: "Not found", path: pathname }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[router] Error handling ${method} ${pathname}:`, message);
    return json({ error: "Internal server error", detail: message }, 500);
  }
}

/**
 * Converts a sqlite result row (array of values) to a plain object
 * using the columns array from the result set.
 */
function rowToObject(columns: string[], row: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = row[i];
  }
  return obj;
}
