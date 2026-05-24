import { sqlite } from "../db.ts";

export interface IntegrationCredentials {
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  extra_config?: Record<string, any>;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export async function getCredentials(
  name: string
): Promise<IntegrationCredentials | null> {
  const result = await sqlite.execute(
    "SELECT api_key, api_secret, access_token, refresh_token, extra_config FROM integrations WHERE name = ?",
    [name]
  );

  if (!result.rows || result.rows.length === 0) {
    return null;
  }

  const cols = result.columns;
  const row = result.rows[0];
  const obj: Record<string, any> = {};
  for (let i = 0; i < cols.length; i++) {
    obj[cols[i]] = row[i];
  }

  let extra_config: Record<string, any> | undefined = undefined;
  if (obj.extra_config) {
    try {
      extra_config = JSON.parse(obj.extra_config);
    } catch {
      extra_config = {};
    }
  }

  return {
    api_key: obj.api_key ?? undefined,
    api_secret: obj.api_secret ?? undefined,
    access_token: obj.access_token ?? undefined,
    refresh_token: obj.refresh_token ?? undefined,
    extra_config,
  };
}

export async function listIntegrations(): Promise<any[]> {
  const result = await sqlite.execute(
    "SELECT id, name, api_key, api_secret, access_token, refresh_token, extra_config, created_at, updated_at FROM integrations ORDER BY name ASC",
    []
  );

  if (!result.rows || result.rows.length === 0) {
    return [];
  }

  const cols = result.columns;

  return result.rows.map((row) => {
    const obj: Record<string, any> = {};
    for (let i = 0; i < cols.length; i++) {
      obj[cols[i]] = row[i];
    }

    const connected = !!(obj.api_key || obj.access_token);

    let maskedApiKey: string | undefined = undefined;
    if (obj.api_key) {
      const key = String(obj.api_key);
      maskedApiKey = key.length > 4 ? key.slice(0, 4) + "***" : "***";
    }

    let extra_config: Record<string, any> | undefined = undefined;
    if (obj.extra_config) {
      try {
        extra_config = JSON.parse(obj.extra_config);
      } catch {
        extra_config = {};
      }
    }

    return {
      id: obj.id,
      name: obj.name,
      connected,
      api_key: maskedApiKey,
      access_token: obj.access_token ? "***" : undefined,
      extra_config,
      created_at: obj.created_at,
      updated_at: obj.updated_at,
    };
  });
}

export async function saveIntegration(
  name: string,
  creds: IntegrationCredentials
): Promise<void> {
  const existing = await sqlite.execute(
    "SELECT id FROM integrations WHERE name = ?",
    [name]
  );

  const extraConfigStr = creds.extra_config
    ? JSON.stringify(creds.extra_config)
    : null;

  const now = new Date().toISOString();

  if (existing.rows && existing.rows.length > 0) {
    await sqlite.execute(
      `INSERT OR REPLACE INTO integrations (id, name, api_key, api_secret, access_token, refresh_token, extra_config, created_at, updated_at)
       VALUES (
         (SELECT id FROM integrations WHERE name = ?),
         ?, ?, ?, ?, ?, ?,
         (SELECT created_at FROM integrations WHERE name = ?),
         ?
       )`,
      [
        name,
        name,
        creds.api_key ?? null,
        creds.api_secret ?? null,
        creds.access_token ?? null,
        creds.refresh_token ?? null,
        extraConfigStr,
        name,
        now,
      ]
    );
  } else {
    const id = crypto.randomUUID();
    await sqlite.execute(
      `INSERT INTO integrations (id, name, api_key, api_secret, access_token, refresh_token, extra_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        creds.api_key ?? null,
        creds.api_secret ?? null,
        creds.access_token ?? null,
        creds.refresh_token ?? null,
        extraConfigStr,
        now,
        now,
      ]
    );
  }
}

export async function removeIntegration(name: string): Promise<void> {
  await sqlite.execute("DELETE FROM integrations WHERE name = ?", [name]);
}

// ─── Individual integration handlers ────────────────────────────────────────

async function handleAhrefs(
  endpoint: string,
  params: string,
  creds: IntegrationCredentials
): Promise<Response> {
  const base = "https://api.ahrefs.com/v3";
  const headers = {
    Authorization: `Bearer ${creds.api_key}`,
    "Content-Type": "application/json",
  };

  let url: string;
  switch (endpoint) {
    case "site-explorer":
      url = `${base}/site-explorer/overview?${params}`;
      break;
    case "keywords":
      url = `${base}/keywords-explorer/matching-terms?${params}`;
      break;
    case "backlinks":
      url = `${base}/site-explorer/all-backlinks?${params}`;
      break;
    case "domain-rating":
      url = `${base}/site-explorer/domain-rating?${params}`;
      break;
    case "organic-keywords":
      url = `${base}/site-explorer/organic-keywords?${params}`;
      break;
    default:
      url = `${base}/${endpoint}?${params}`;
  }

  const res = await fetch(url, { headers });
  const data = await res.json();
  return json(data, res.status);
}

async function handleGA4(
  req: Request,
  endpoint: string,
  params: string,
  creds: IntegrationCredentials
): Promise<Response> {
  const propertyId = creds.extra_config?.property_id ?? "";
  const base = `https://analyticsdata.googleapis.com/v1beta/properties`;
  const headers = {
    Authorization: `Bearer ${creds.access_token}`,
    "Content-Type": "application/json",
  };

  let url: string;
  let method = "GET";
  let body: string | undefined;

  switch (endpoint) {
    case "realtime":
      url = `${base}/${propertyId}:runRealtimeReport`;
      break;
    case "report":
      url = `${base}/${propertyId}:runReport`;
      method = "POST";
      body = await req.text();
      break;
    case "funnel":
      url = `https://analyticsdata.googleapis.com/v1alpha/properties/${propertyId}:runFunnelReport`;
      method = "POST";
      body = await req.text();
      break;
    default:
      url = `${base}/${propertyId}/${endpoint}`;
  }

  const res = await fetch(url, { method, headers, body });
  const data = await res.json();
  return json(data, res.status);
}

async function handleGSC(
  req: Request,
  endpoint: string,
  params: string,
  creds: IntegrationCredentials
): Promise<Response> {
  const siteUrl = encodeURIComponent(creds.extra_config?.site_url ?? "");
  const base = `https://searchconsole.googleapis.com/webmasters/v3/sites`;
  const headers = {
    Authorization: `Bearer ${creds.access_token}`,
    "Content-Type": "application/json",
  };

  let url: string;
  let method = "GET";
  let body: string | undefined;

  switch (endpoint) {
    case "search-analytics":
    case "searchanalytics":
      url = `${base}/${siteUrl}/searchAnalytics/query`;
      method = "POST";
      body = await req.text();
      break;
    case "sitemaps":
      url = `${base}/${siteUrl}/sitemaps`;
      break;
    default:
      url = `${base}/${siteUrl}/${endpoint}`;
  }

  const res = await fetch(url, { method, headers, body });
  const data = await res.json();
  return json(data, res.status);
}

async function handleLinkedIn(
  endpoint: string,
  params: string,
  creds: IntegrationCredentials
): Promise<Response> {
  const base = "https://api.linkedin.com/v2";
  const headers = {
    Authorization: `Bearer ${creds.access_token}`,
    "Content-Type": "application/json",
  };

  let url: string;
  const authorId = creds.extra_config?.author_id ?? "";

  switch (endpoint) {
    case "profile":
      url = `${base}/me?projection=(id,firstName,lastName,profilePicture)`;
      break;
    case "posts":
      url = `${base}/ugcPosts?q=authors&authors=List(${authorId})&${params}`;
      break;
    case "analytics":
      url = `${base}/organizationalEntityShareStatistics?${params}`;
      break;
    case "connections":
      url = `${base}/connections?q=viewer&${params}`;
      break;
    default:
      url = `${base}/${endpoint}?${params}`;
  }

  const res = await fetch(url, { headers });
  const data = await res.json();
  return json(data, res.status);
}

async function handleOutlook(
  req: Request,
  endpoint: string,
  params: string,
  creds: IntegrationCredentials
): Promise<Response> {
  const base = "https://graph.microsoft.com/v1.0/me";
  const headers = {
    Authorization: `Bearer ${creds.access_token}`,
    "Content-Type": "application/json",
  };

  let url: string;
  let method = "GET";
  let body: string | undefined;

  switch (endpoint) {
    case "inbox":
    case "messages":
      url = `${base}/messages?$top=20&$orderby=receivedDateTime desc&${params}`;
      break;
    case "send":
      url = `${base}/sendMail`;
      method = "POST";
      body = await req.text();
      break;
    case "calendar":
      url = `${base}/calendar/events?${params}`;
      break;
    case "contacts":
      url = `${base}/contacts?${params}`;
      break;
    default:
      url = `${base}/${endpoint}?${params}`;
  }

  const res = await fetch(url, { method, headers, body });
  const data = await res.json();
  return json(data, res.status);
}

async function handleWordPress(
  req: Request,
  endpoint: string,
  params: string,
  creds: IntegrationCredentials
): Promise<Response> {
  const siteUrl = creds.extra_config?.site_url ?? "";
  const base = `${siteUrl}/wp-json/wp/v2`;
  const basicAuth = btoa(`${creds.api_key}:${creds.api_secret}`);
  const headers = {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/json",
  };

  let url: string;
  let method = "GET";
  let body: string | undefined;

  switch (endpoint) {
    case "posts":
      url = `${base}/posts?${params}`;
      break;
    case "pages":
      url = `${base}/pages?${params}`;
      break;
    case "media":
      url = `${base}/media?${params}`;
      break;
    case "categories":
      url = `${base}/categories?${params}`;
      break;
    case "publish-post":
      url = `${base}/posts`;
      method = "POST";
      body = await req.text();
      break;
    default:
      url = `${base}/${endpoint}?${params}`;
  }

  const res = await fetch(url, { method, headers, body });
  const data = await res.json();
  return json(data, res.status);
}

async function handleYouTube(
  endpoint: string,
  params: string,
  creds: IntegrationCredentials,
  searchParams: URLSearchParams
): Promise<Response> {
  const base = "https://www.googleapis.com/youtube/v3";
  const analyticsBase = "https://youtubeanalytics.googleapis.com/v2";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let authParam = "";
  if (creds.access_token) {
    headers["Authorization"] = `Bearer ${creds.access_token}`;
  } else if (creds.api_key) {
    authParam = `key=${encodeURIComponent(creds.api_key)}`;
  }

  const joinParams = (a: string, b: string) =>
    [a, b].filter(Boolean).join("&");

  let url: string;
  switch (endpoint) {
    case "channels":
      url = `${base}/channels?part=snippet,statistics&mine=true&${joinParams(params, authParam)}`;
      break;
    case "videos":
      url = `${base}/videos?part=snippet,statistics&${joinParams(params, authParam)}`;
      break;
    case "playlists":
      url = `${base}/playlists?part=snippet&mine=true&${joinParams(params, authParam)}`;
      break;
    case "search":
      url = `${base}/search?part=snippet&${joinParams(params, authParam)}`;
      break;
    case "analytics":
      url = `${analyticsBase}/reports?${joinParams(params, authParam)}`;
      break;
    default:
      url = `${base}/${endpoint}?${joinParams(params, authParam)}`;
  }

  const res = await fetch(url, { headers });
  const data = await res.json();
  return json(data, res.status);
}

async function handleProductHunt(
  endpoint: string,
  searchParams: URLSearchParams,
  creds: IntegrationCredentials
): Promise<Response> {
  const url = "https://api.producthunt.com/v2/api/graphql";
  const headers = {
    Authorization: `Bearer ${creds.api_key}`,
    "Content-Type": "application/json",
  };

  let query: string;
  switch (endpoint) {
    case "posts":
      query =
        "{ posts(first: 10) { edges { node { id name tagline votesCount } } } }";
      break;
    case "topics":
      query =
        "{ topics(first: 20) { edges { node { id name followersCount } } } }";
      break;
    default:
      query = searchParams.get("query") ?? "{ posts(first: 5) { edges { node { id name } } } }";
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return json(data, res.status);
}

// ─── Main proxy dispatcher ───────────────────────────────────────────────────

export async function handleIntegrationProxy(
  req: Request,
  name: string,
  searchParams: URLSearchParams,
  creds: IntegrationCredentials
): Promise<Response> {
  const endpoint = searchParams.get("endpoint") ?? "";

  // Build forwarded query string — exclude our own meta params
  const excluded = new Set(["endpoint", "integration"]);
  const forwardedParts: string[] = [];
  searchParams.forEach((value, key) => {
    if (!excluded.has(key)) {
      forwardedParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });
  const params = forwardedParts.join("&");

  switch (name) {
    case "ahrefs":
      return handleAhrefs(endpoint, params, creds);
    case "ga4":
      return handleGA4(req, endpoint, params, creds);
    case "gsc":
      return handleGSC(req, endpoint, params, creds);
    case "linkedin":
      return handleLinkedIn(endpoint, params, creds);
    case "outlook":
      return handleOutlook(req, endpoint, params, creds);
    case "wordpress":
      return handleWordPress(req, endpoint, params, creds);
    case "youtube":
      return handleYouTube(endpoint, params, creds, searchParams);
    case "producthunt":
      return handleProductHunt(endpoint, searchParams, creds);
    default:
      return json({ error: `Unknown integration: ${name}` }, 400);
  }
}

// ─── HTTP route handler ──────────────────────────────────────────────────────

export async function handleIntegrationsRoute(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.replace(/^\/+/, "").split("/");
  // Expect paths like: /api/integrations, /api/integrations/:name, /api/integrations/:name/proxy
  const integrationName = pathParts[2] ?? null;
  const action = pathParts[3] ?? null;

  // GET /api/integrations — list all
  if (req.method === "GET" && !integrationName) {
    const integrations = await listIntegrations();
    return json({ integrations });
  }

  // GET /api/integrations/:name — get single (masked)
  if (req.method === "GET" && integrationName && action === null) {
    const creds = await getCredentials(integrationName);
    if (!creds) {
      return json({ error: "Integration not found" }, 404);
    }
    const masked: any = { name: integrationName, connected: true };
    if (creds.api_key) {
      masked.api_key = creds.api_key.length > 4 ? creds.api_key.slice(0, 4) + "***" : "***";
    }
    if (creds.access_token) {
      masked.access_token = "***";
    }
    masked.extra_config = creds.extra_config;
    return json(masked);
  }

  // POST /api/integrations/:name — save/upsert
  if (req.method === "POST" && integrationName && action === null) {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    await saveIntegration(integrationName, body as IntegrationCredentials);
    return json({ success: true, name: integrationName });
  }

  // DELETE /api/integrations/:name — remove
  if (req.method === "DELETE" && integrationName && action === null) {
    await removeIntegration(integrationName);
    return json({ success: true });
  }

  // GET|POST /api/integrations/:name/proxy — proxy to external API
  if (integrationName && action === "proxy") {
    const creds = await getCredentials(integrationName);
    if (!creds) {
      return json(
        { error: `Integration '${integrationName}' is not configured` },
        404
      );
    }
    return handleIntegrationProxy(req, integrationName, url.searchParams, creds);
  }

  return json({ error: "Not found" }, 404);
}
