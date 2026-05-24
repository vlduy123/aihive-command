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

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { error: text.slice(0, 500) || `HTTP ${res.status}` }; }
}

export async function getCredentials(name: string): Promise<IntegrationCredentials | null> {
  const result = await sqlite.execute(
    "SELECT api_key, api_secret, access_token, refresh_token, extra_config FROM integrations WHERE name = ?",
    [name]
  );
  if (!result.rows || result.rows.length === 0) return null;
  const cols = result.columns;
  const row = result.rows[0];
  const obj: Record<string, any> = {};
  for (let i = 0; i < cols.length; i++) obj[cols[i]] = row[i];
  let extra_config: Record<string, any> | undefined;
  if (obj.extra_config) {
    try { extra_config = JSON.parse(obj.extra_config); } catch { extra_config = {}; }
  }
  return {
    api_key: obj.api_key ?? undefined,
    api_secret: obj.api_secret ?? undefined,
    access_token: obj.access_token ?? undefined,
    refresh_token: obj.refresh_token ?? undefined,
    extra_config,
  };
}

// ─── Ahrefs ──────────────────────────────────────────────────────────────────
// Docs: https://docs.ahrefs.com/en/api/reference/site-explorer
// Auth: Authorization: Bearer {api_key}
// IMPORTANT: /metrics and /domain-rating do NOT accept a 'select' parameter.
// /all-backlinks and /organic-keywords require 'select'.
// /keywords-explorer/matching-terms requires 'select' and 'country'.
async function handleAhrefs(endpoint: string, params: string, creds: IntegrationCredentials): Promise<Response> {
  const base = "https://api.ahrefs.com/v3";
  const headers = { Authorization: `Bearer ${creds.api_key}` };
  const today = new Date().toISOString().slice(0, 10);

  const sp = new URLSearchParams(params);
  // Use URL param → saved extra_config.target → empty
  const target = sp.get("target") || creds.extra_config?.target || "";
  if (target) sp.set("target", target);

  let url: string;
  switch (endpoint) {
    case "site-explorer": {
      // GET /v3/site-explorer/metrics — required: target, date — NO select
      if (!sp.get("target")) {
        return json({ error: "Target domain required. Set it in Ahrefs Settings." }, 400);
      }
      if (!sp.has("date")) sp.set("date", today);
      sp.delete("select"); // metrics endpoint does not accept select
      url = `${base}/site-explorer/metrics?${sp.toString()}`;
      break;
    }
    case "keywords": {
      // GET /v3/keywords-explorer/matching-terms — required: select, country
      // Optional: keywords (comma-separated seed keywords)
      if (!sp.has("select")) sp.set("select", "keyword,volume,difficulty,cpc,traffic_potential,global_volume");
      if (!sp.has("country")) sp.set("country", "us");
      // Param is 'keywords' (plural), not 'keyword'
      const seed = sp.get("keywords") || sp.get("keyword") || sp.get("q") || "seo";
      sp.delete("keyword");
      sp.delete("q");
      sp.set("keywords", seed);
      if (!sp.has("limit")) sp.set("limit", "50");
      url = `${base}/keywords-explorer/matching-terms?${sp.toString()}`;
      break;
    }
    case "backlinks": {
      // GET /v3/site-explorer/all-backlinks — required: target, select
      if (!sp.get("target")) {
        return json({ error: "Target domain required. Set it in Ahrefs Settings." }, 400);
      }
      if (!sp.has("select")) {
        sp.set("select", "url_from,domain_rating_source,anchor,name_source,title,first_seen,is_dofollow,traffic");
      }
      if (!sp.has("limit")) sp.set("limit", "50");
      url = `${base}/site-explorer/all-backlinks?${sp.toString()}`;
      break;
    }
    case "domain-rating": {
      // GET /v3/site-explorer/domain-rating — required: target, date — NO select
      if (!sp.get("target")) sp.set("target", "ahrefs.com");
      if (!sp.has("date")) sp.set("date", today);
      sp.delete("select"); // not supported
      url = `${base}/site-explorer/domain-rating?${sp.toString()}`;
      break;
    }
    case "organic-keywords": {
      // GET /v3/site-explorer/organic-keywords — required: target, select, date
      if (!sp.get("target")) {
        return json({ error: "Target domain required. Set it in Ahrefs Settings." }, 400);
      }
      if (!sp.has("select")) sp.set("select", "keyword,volume,sum_traffic,best_position,cpc,keyword_difficulty");
      if (!sp.has("country")) sp.set("country", "us");
      if (!sp.has("date")) sp.set("date", today);
      if (!sp.has("limit")) sp.set("limit", "50");
      url = `${base}/site-explorer/organic-keywords?${sp.toString()}`;
      break;
    }
    case "top-pages": {
      // GET /v3/site-explorer/top-pages — required: target, select, date
      if (!sp.get("target")) {
        return json({ error: "Target domain required. Set it in Ahrefs Settings." }, 400);
      }
      if (!sp.has("select")) sp.set("select", "url,sum_traffic,keywords,top_keyword,top_keyword_best_position,value");
      if (!sp.has("country")) sp.set("country", "us");
      if (!sp.has("date")) sp.set("date", today);
      if (!sp.has("limit")) sp.set("limit", "50");
      url = `${base}/site-explorer/top-pages?${sp.toString()}`;
      break;
    }
    case "referring-domains": {
      // GET /v3/site-explorer/refdomains — required: target, select
      // NOTE: path is /refdomains, NOT /referring-domains
      if (!sp.get("target")) {
        return json({ error: "Target domain required. Set it in Ahrefs Settings." }, 400);
      }
      if (!sp.has("select")) sp.set("select", "domain,domain_rating,dofollow_links,dofollow_linked_domains,traffic_domain,first_seen");
      if (!sp.has("limit")) sp.set("limit", "50");
      url = `${base}/site-explorer/refdomains?${sp.toString()}`;
      break;
    }
    case "backlinks-stats": {
      // GET /v3/site-explorer/backlinks-stats — required: target, date — NO select
      if (!sp.get("target")) {
        return json({ error: "Target domain required. Set it in Ahrefs Settings." }, 400);
      }
      if (!sp.has("date")) sp.set("date", today);
      sp.delete("select");
      url = `${base}/site-explorer/backlinks-stats?${sp.toString()}`;
      break;
    }
    default:
      return json({ error: `Unknown Ahrefs endpoint: ${endpoint}` }, 400);
  }

  const res = await fetch(url, { headers });
  const data = await safeJson(res);
  return json(data, res.status);
}

// ─── Google Analytics 4 ──────────────────────────────────────────────────────
// Docs: https://developers.google.com/analytics/devguides/reporting/data/v1/rest
// All reporting endpoints use POST. Auth: Bearer access_token (OAuth 2.0).
async function handleGA4(req: Request, endpoint: string, _params: string, creds: IntegrationCredentials): Promise<Response> {
  const propertyId = creds.extra_config?.property_id ?? "";
  const base = `https://analyticsdata.googleapis.com/v1beta/properties`;
  const headers = { Authorization: `Bearer ${creds.access_token}`, "Content-Type": "application/json" };

  let url: string;
  let body: string;

  switch (endpoint) {
    case "realtime": {
      // POST runRealtimeReport
      url = `${base}/${propertyId}:runRealtimeReport`;
      const rb = await req.text();
      body = rb || JSON.stringify({
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        minuteRanges: [{ name: "last30Minutes", startMinutesAgo: 29, endMinutesAgo: 0 }],
      });
      break;
    }
    case "report": {
      // POST runReport
      url = `${base}/${propertyId}:runReport`;
      const rb = await req.text();
      body = rb || JSON.stringify({
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "eventCount" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      });
      break;
    }
    case "user-acquisition": {
      // POST runReport — acquisition by channel
      url = `${base}/${propertyId}:runReport`;
      body = JSON.stringify({
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "newUsers" }, { name: "engagementRate" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "20",
      });
      break;
    }
    case "top-events": {
      // POST runReport — top events by count
      url = `${base}/${propertyId}:runReport`;
      body = JSON.stringify({
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "20",
      });
      break;
    }
    case "kpi": {
      // POST runReport — overall KPIs, no dimensions (returns single aggregated row)
      url = `${base}/${propertyId}:runReport`;
      const sp2 = new URLSearchParams(_params);
      const kpiDays = sp2.get("days") || "30";
      body = JSON.stringify({
        metrics: [
          { name: "sessions" }, { name: "activeUsers" }, { name: "newUsers" },
          { name: "engagementRate" }, { name: "screenPageViews" }, { name: "bounceRate" },
        ],
        dateRanges: [
          { name: "current", startDate: `${kpiDays}daysAgo`, endDate: "today" },
          { name: "previous", startDate: `${Number(kpiDays) * 2}daysAgo`, endDate: `${Number(kpiDays) + 1}daysAgo` },
        ],
      });
      break;
    }
    case "traffic-over-time": {
      // POST runReport — daily sessions for line chart
      url = `${base}/${propertyId}:runReport`;
      const sp3 = new URLSearchParams(_params);
      const totDays = sp3.get("days") || "30";
      body = JSON.stringify({
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        dateRanges: [{ startDate: `${totDays}daysAgo`, endDate: "today" }],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        limit: "90",
      });
      break;
    }
    case "device-breakdown": {
      // POST runReport — sessions by device category
      url = `${base}/${propertyId}:runReport`;
      body = JSON.stringify({
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "bounceRate" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      });
      break;
    }
    case "page-views": {
      // POST runReport — top pages by screen views
      url = `${base}/${propertyId}:runReport`;
      body = JSON.stringify({
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "bounceRate" }],
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "25",
      });
      break;
    }
    case "funnel": {
      // POST runFunnelReport (v1alpha)
      url = `https://analyticsdata.googleapis.com/v1alpha/properties/${propertyId}:runFunnelReport`;
      const rb = await req.text();
      body = rb || JSON.stringify({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        funnel: {
          steps: [
            { name: "Session Start", filterExpression: { funnelEventFilter: { eventName: "session_start" } } },
            { name: "Sign Up", filterExpression: { funnelEventFilter: { eventName: "sign_up" } } },
          ],
        },
      });
      break;
    }
    default:
      url = `${base}/${propertyId}/${endpoint}`;
      body = await req.text();
  }

  const res = await fetch(url, { method: "POST", headers, body });
  const data = await safeJson(res);
  return json(data, res.status);
}

// ─── Google Search Console ────────────────────────────────────────────────────
async function handleGSC(req: Request, endpoint: string, _params: string, creds: IntegrationCredentials): Promise<Response> {
  const siteUrl = encodeURIComponent(creds.extra_config?.site_url ?? "");
  const base = `https://searchconsole.googleapis.com/webmasters/v3/sites`;
  const headers = { Authorization: `Bearer ${creds.access_token}`, "Content-Type": "application/json" };

  let url: string;
  let method = "GET";
  let body: string | undefined;

  switch (endpoint) {
    case "search-analytics":
    case "searchanalytics": {
      url = `${base}/${siteUrl}/searchAnalytics/query`;
      method = "POST";
      const rb = await req.text();
      body = rb || JSON.stringify({
        startDate: "2025-01-01",
        endDate: new Date().toISOString().slice(0, 10),
        dimensions: ["query"],
        rowLimit: 50,
      });
      break;
    }
    case "pages": {
      // POST search analytics grouped by page
      url = `${base}/${siteUrl}/searchAnalytics/query`;
      method = "POST";
      body = JSON.stringify({
        startDate: new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        dimensions: ["page"],
        rowLimit: 25,
      });
      break;
    }
    case "sitemaps":
      url = `${base}/${siteUrl}/sitemaps`;
      break;
    default:
      url = `${base}/${siteUrl}/${endpoint}`;
  }

  const res = await fetch(url, { method, headers, body });
  const data = await safeJson(res);
  return json(data, res.status);
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
async function handleLinkedIn(endpoint: string, params: string, creds: IntegrationCredentials): Promise<Response> {
  const base = "https://api.linkedin.com/v2";
  const headers = { Authorization: `Bearer ${creds.access_token}`, "Content-Type": "application/json" };
  const authorId = creds.extra_config?.author_id ?? "";

  let url: string;
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
  const data = await safeJson(res);
  return json(data, res.status);
}

// ─── Outlook ─────────────────────────────────────────────────────────────────
async function handleOutlook(req: Request, endpoint: string, params: string, creds: IntegrationCredentials): Promise<Response> {
  const base = "https://graph.microsoft.com/v1.0/me";
  const headers = { Authorization: `Bearer ${creds.access_token}`, "Content-Type": "application/json" };

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
      url = `${base}/calendar/events?$top=20&$orderby=start/dateTime asc&${params}`;
      break;
    case "contacts":
      url = `${base}/contacts?$top=20&${params}`;
      break;
    default:
      url = `${base}/${endpoint}?${params}`;
  }

  const res = await fetch(url, { method, headers, body });
  const data = await safeJson(res);
  return json(data, res.status);
}

// ─── WordPress ───────────────────────────────────────────────────────────────
// Docs: https://developer.wordpress.org/rest-api/
// Auth: Basic base64(username:application_password). Requires HTTPS.
async function handleWordPress(req: Request, endpoint: string, params: string, creds: IntegrationCredentials): Promise<Response> {
  const siteUrl = (creds.extra_config?.site_url ?? "").replace(/\/$/, "");
  if (!siteUrl) return json({ error: "WordPress site URL required. Add it in Settings." }, 400);
  const base = `${siteUrl}/wp-json/wp/v2`;
  const basicAuth = btoa(`${creds.api_key ?? ""}:${creds.api_secret ?? ""}`);
  const headers = { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/json" };

  let url: string;
  let method = "GET";
  let body: string | undefined;

  switch (endpoint) {
    case "posts":
      url = `${base}/posts?per_page=20&orderby=date&order=desc&${params}`;
      break;
    case "pages":
      url = `${base}/pages?per_page=20&orderby=date&order=desc&${params}`;
      break;
    case "media":
      url = `${base}/media?per_page=20&${params}`;
      break;
    case "categories":
      url = `${base}/categories?per_page=50&${params}`;
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
  const data = await safeJson(res);
  return json(data, res.status);
}

// ─── YouTube ─────────────────────────────────────────────────────────────────
// Docs: https://developers.google.com/youtube/v3
// mine=true requires OAuth. API key works only for public data.
// channels?mine=true, playlists?mine=true → OAuth required.
async function handleYouTube(endpoint: string, params: string, creds: IntegrationCredentials): Promise<Response> {
  const base = "https://www.googleapis.com/youtube/v3";
  const hasOAuth = !!creds.access_token;
  const headers: Record<string, string> = {};
  let authParam = "";

  if (hasOAuth) {
    headers["Authorization"] = `Bearer ${creds.access_token}`;
  } else if (creds.api_key) {
    authParam = `key=${encodeURIComponent(creds.api_key)}`;
  }

  const jp = (a: string, b: string) => [a, b].filter(Boolean).join("&");

  let url: string;
  switch (endpoint) {
    case "channels":
      if (hasOAuth) {
        url = `${base}/channels?part=snippet,statistics&mine=true&${jp(params, authParam)}`;
      } else {
        // API key: mostPopular chart (no mine=true allowed without OAuth)
        url = `${base}/channels?part=snippet,statistics&chart=mostPopular&maxResults=5&${jp(params, authParam)}`;
      }
      break;
    case "videos":
      // chart=mostPopular works with API key
      url = `${base}/videos?part=snippet,statistics&chart=mostPopular&maxResults=10&${jp(params, authParam)}`;
      break;
    case "playlists":
      if (hasOAuth) {
        url = `${base}/playlists?part=snippet&mine=true&maxResults=20&${jp(params, authParam)}`;
      } else {
        return json({ error: "Playlists requires an OAuth access token. Add one in Settings." }, 401);
      }
      break;
    case "search":
      url = `${base}/search?part=snippet&type=video&maxResults=10&${jp(params, authParam)}`;
      break;
    default:
      url = `${base}/${endpoint}?${jp(params, authParam)}`;
  }

  const res = await fetch(url, { headers });
  const data = await safeJson(res);
  return json(data, res.status);
}

// ─── Product Hunt ─────────────────────────────────────────────────────────────
async function handleProductHunt(endpoint: string, searchParams: URLSearchParams, creds: IntegrationCredentials): Promise<Response> {
  const url = "https://api.producthunt.com/v2/api/graphql";
  const headers = { Authorization: `Bearer ${creds.api_key}`, "Content-Type": "application/json" };

  let query: string;
  switch (endpoint) {
    case "posts":
      // RANKING = today's featured posts by score (default PH order)
      query = `{ posts(first: 20, order: RANKING) { edges { node { id name tagline votesCount commentsCount url createdAt thumbnail { url } topics { edges { node { name } } } } } } }`;
      break;
    case "topics":
      query = `{ topics(first: 30) { edges { node { id name slug followersCount } } } }`;
      break;
    default:
      query = searchParams.get("query") ?? `{ posts(first: 10, order: RANKING) { edges { node { id name tagline votesCount } } } }`;
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query }) });
  const data = await safeJson(res);
  return json(data, res.status);
}

// ─── Test connection ──────────────────────────────────────────────────────────
async function handleTestConnection(name: string, creds: IntegrationCredentials): Promise<{ ok: boolean; message: string }> {
  try {
    switch (name) {
      case "ahrefs": {
        // domain-rating costs 2 units, requires target+date, NO select param
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(
          `https://api.ahrefs.com/v3/site-explorer/domain-rating?target=ahrefs.com&date=${today}`,
          { headers: { Authorization: `Bearer ${creds.api_key}` } }
        );
        if (res.status === 401 || res.status === 403) return { ok: false, message: "Invalid API key" };
        if (res.status === 429) return { ok: false, message: "Rate limited — try again shortly" };
        if (!res.ok) {
          const d = await safeJson(res);
          return { ok: false, message: d?.error ?? `API error ${res.status}` };
        }
        return { ok: true, message: "API key verified" };
      }
      case "linkedin": {
        const res = await fetch("https://api.linkedin.com/v2/me", {
          headers: { Authorization: `Bearer ${creds.access_token}` },
        });
        if (!res.ok) return { ok: false, message: "Invalid access token" };
        return { ok: true, message: "Access token verified" };
      }
      case "outlook": {
        const res = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${creds.access_token}` },
        });
        if (!res.ok) return { ok: false, message: "Invalid access token" };
        return { ok: true, message: "Access token verified" };
      }
      case "ga4": {
        const res = await fetch(
          `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(creds.access_token ?? "")}`
        );
        if (!res.ok) return { ok: false, message: "Invalid or expired access token" };
        return { ok: true, message: "Access token verified" };
      }
      case "gsc": {
        const res = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites", {
          headers: { Authorization: `Bearer ${creds.access_token}` },
        });
        if (!res.ok) return { ok: false, message: "Invalid access token" };
        return { ok: true, message: "Access token verified" };
      }
      case "youtube": {
        if (creds.access_token) {
          const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`, {
            headers: { Authorization: `Bearer ${creds.access_token}` },
          });
          if (!res.ok) return { ok: false, message: "Invalid access token" };
          return { ok: true, message: "Access token verified" };
        }
        // API key test via mostPopular videos (public endpoint, no OAuth needed)
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${encodeURIComponent(creds.api_key ?? "")}`
        );
        if (!res.ok) {
          const d = await safeJson(res);
          return { ok: false, message: d?.error?.message ?? `API error ${res.status}` };
        }
        return { ok: true, message: "API key verified" };
      }
      case "producthunt": {
        const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
          method: "POST",
          headers: { Authorization: `Bearer ${creds.api_key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: "{ viewer { id } }" }),
        });
        if (!res.ok) return { ok: false, message: "Invalid API key" };
        const d = await safeJson(res);
        if (d.errors?.some((e: any) => /auth|unauthorized/i.test(e.message ?? ""))) {
          return { ok: false, message: "Invalid API key" };
        }
        return { ok: true, message: "API key verified" };
      }
      case "wordpress": {
        const siteUrl = (creds.extra_config?.site_url ?? "").replace(/\/$/, "");
        if (!siteUrl) return { ok: false, message: "Site URL is required" };
        const basicAuth = btoa(`${creds.api_key ?? ""}:${creds.api_secret ?? ""}`);
        const res = await fetch(`${siteUrl}/wp-json/wp/v2/users/me`, {
          headers: { Authorization: `Basic ${basicAuth}` },
        });
        if (!res.ok) return { ok: false, message: `Auth failed (${res.status})` };
        return { ok: true, message: "Credentials verified" };
      }
      default:
        return { ok: false, message: "Unknown integration" };
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Connection failed" };
  }
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────
export async function handleIntegrationProxy(
  req: Request,
  name: string,
  searchParams: URLSearchParams,
  creds: IntegrationCredentials
): Promise<Response> {
  const endpoint = searchParams.get("endpoint") ?? "";

  // Guard missing credentials
  if (["ahrefs", "youtube", "producthunt"].includes(name) && !creds.api_key && !creds.access_token) {
    return json({ error: `${name} credentials not configured. Add them in Settings.` }, 401);
  }
  if (["ga4", "gsc", "linkedin", "outlook"].includes(name) && !creds.access_token) {
    return json({ error: `${name} access token not configured. Add it in Settings.` }, 401);
  }
  if (name === "wordpress" && !creds.api_key) {
    return json({ error: "WordPress username not configured. Add credentials in Settings." }, 401);
  }

  // Test connection
  if (endpoint === "test") {
    const result = await handleTestConnection(name, creds);
    return json(result, result.ok ? 200 : 401);
  }

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
    case "ahrefs":      return handleAhrefs(endpoint, params, creds);
    case "ga4":         return handleGA4(req, endpoint, params, creds);
    case "gsc":         return handleGSC(req, endpoint, params, creds);
    case "linkedin":    return handleLinkedIn(endpoint, params, creds);
    case "outlook":     return handleOutlook(req, endpoint, params, creds);
    case "wordpress":   return handleWordPress(req, endpoint, params, creds);
    case "youtube":     return handleYouTube(endpoint, params, creds);
    case "producthunt": return handleProductHunt(endpoint, searchParams, creds);
    default:            return json({ error: `Unknown integration: ${name}` }, 400);
  }
}
