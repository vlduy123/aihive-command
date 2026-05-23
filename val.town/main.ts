import { initDB } from "./db.ts";
import { handleRequest } from "./router.ts";
import { getFrontendHTML } from "./frontend.ts";

let initialized = false;

export default async function(req: Request): Promise<Response> {
  if (!initialized) {
    await initDB();
    initialized = true;
  }

  const url = new URL(req.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (url.pathname.startsWith("/api/")) {
    return handleRequest(req, url);
  }

  return new Response(getFrontendHTML(), {
    headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
  });
}
