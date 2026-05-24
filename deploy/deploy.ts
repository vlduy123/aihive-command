#!/usr/bin/env deno run --allow-net --allow-env --allow-read

/**
 * AIHive Command Center — val.town Deployment Script
 *
 * Usage:
 *   export VALTOWN_TOKEN=your_token
 *   export VALTOWN_USERNAME=your_username
 *   deno run --allow-net --allow-env --allow-read deploy/deploy.ts
 */

const BASE_URL = "https://api.val.town/v1";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// val.town injects the current user's token as "valtown"; VALTOWN_TOKEN is the local override
const token = Deno.env.get("valtown") ?? Deno.env.get("VALTOWN_TOKEN");
if (!token) {
  console.error("ERROR: set VALTOWN_TOKEN (local) or run inside val.town where 'valtown' is injected");
  Deno.exit(1);
}

const username = Deno.env.get("VALTOWN_USERNAME");
if (!username) {
  console.error("ERROR: VALTOWN_USERNAME env var required");
  Deno.exit(1);
}

const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
};

// ---------------------------------------------------------------------------
// Val.town API helpers
// ---------------------------------------------------------------------------

interface Val {
  id: string;
  name: string;
  author: { username: string };
  code: string;
  privacy: string;
  type: string;
  version: number;
  url: string;
}

interface ValListResponse {
  data: Val[];
  links: { next?: string };
}

async function listMyVals(): Promise<Val[]> {
  const vals: Val[] = [];
  let url: string | undefined = `${BASE_URL}/me/vals?limit=100`;

  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to list vals (${res.status}): ${text}`);
    }
    const body: ValListResponse = await res.json();
    vals.push(...body.data);
    url = body.links.next;
  }

  return vals;
}

async function createVal(
  name: string,
  code: string,
  type: "http" | "script" | "email" = "script",
): Promise<Val> {
  const res = await fetch(`${BASE_URL}/vals`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, code, privacy: "public", type }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create val "${name}" (${res.status}): ${text}`);
  }
  return res.json();
}

async function updateVal(id: string, code: string): Promise<Val> {
  const res = await fetch(`${BASE_URL}/vals/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update val id="${id}" (${res.status}): ${text}`);
  }
  return res.json();
}

async function upsertVal(
  existingVals: Map<string, Val>,
  name: string,
  code: string,
  type: "http" | "script" | "email" = "script",
): Promise<Val> {
  const existing = existingVals.get(name);
  if (existing) {
    console.log(`  Updating existing val: ${name} (id=${existing.id})`);
    return updateVal(existing.id, code);
  } else {
    console.log(`  Creating new val: ${name}`);
    return createVal(name, code, type);
  }
}

// ---------------------------------------------------------------------------
// Source file reader
// ---------------------------------------------------------------------------

async function readSource(relativePath: string): Promise<string> {
  // Resolve relative to the project root (one level above deploy/)
  const scriptDir = new URL(".", import.meta.url).pathname;
  // On Windows the pathname starts with /C:/ — normalize
  const projectRoot = scriptDir.replace(/\/deploy\/?$/, "").replace(/^\/([A-Z]:)/, "$1");
  const fullPath = `${projectRoot}/${relativePath}`;
  try {
    return await Deno.readTextFile(fullPath);
  } catch {
    console.warn(`  WARNING: Could not read ${fullPath} — using empty stub`);
    return `// stub: ${relativePath} not found at deploy time\nexport {};\n`;
  }
}

// ---------------------------------------------------------------------------
// Import rewriter
// ---------------------------------------------------------------------------

/**
 * Replace local relative imports with esm.town URLs.
 *
 * e.g.  import { X } from "./types.ts"
 *   →   import { X } from "https://esm.town/v/USERNAME/aihive_types"
 *
 * e.g.  import { X } from "../db.ts"
 *   →   import { X } from "https://esm.town/v/USERNAME/aihive_db"
 */
function rewriteImports(code: string, user: string): string {
  const fileToVal: Record<string, string> = {
    "types.ts": "aihive_types",
    "db.ts": "aihive_db",
    "api/agents.ts": "aihive_agents",
    "api/llm.ts": "aihive_llm",
    "api/integrations.ts": "aihive_integrations",
    "api/chat.ts": "aihive_chat",
    "router.ts": "aihive_router",
    "frontend.ts": "aihive_frontend",
    "main.ts": "aihive_command",
  };

  // Match: from "./foo" | from "../foo" | from "./api/foo"
  return code.replace(
    /from\s+["']([\.\/][^"']+)["']/g,
    (match, rawPath: string) => {
      // Normalise: strip leading ./ or ../
      const normalised = rawPath.replace(/^\.\.?\//, "").replace(/^\.\.?\//, "");
      // Look up
      for (const [file, valName] of Object.entries(fileToVal)) {
        if (normalised === file || normalised === file.replace(/\.ts$/, "")) {
          return `from "https://esm.town/v/${user}/${valName}"`;
        }
      }
      // Unknown local import — leave as-is but warn
      console.warn(`    WARN: unresolved local import: ${rawPath}`);
      return match;
    },
  );
}

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------

interface ModuleDef {
  valName: string;
  sourceFile: string;
  type: "http" | "script";
}

const MODULES: ModuleDef[] = [
  { valName: "aihive_types", sourceFile: "types.ts", type: "script" },
  { valName: "aihive_db", sourceFile: "db.ts", type: "script" },
  { valName: "aihive_agents", sourceFile: "api/agents.ts", type: "script" },
  { valName: "aihive_llm", sourceFile: "api/llm.ts", type: "script" },
  { valName: "aihive_integrations", sourceFile: "api/integrations.ts", type: "script" },
  { valName: "aihive_chat", sourceFile: "api/chat.ts", type: "script" },
  { valName: "aihive_router", sourceFile: "router.ts", type: "script" },
  { valName: "aihive_frontend", sourceFile: "frontend.ts", type: "script" },
  { valName: "aihive_command", sourceFile: "main.ts", type: "http" },
];

// ---------------------------------------------------------------------------
// Main deployment logic
// ---------------------------------------------------------------------------

async function deploy() {
  console.log("=== AIHive Command Center — val.town Deployer ===");
  console.log(`Username : ${username}`);
  console.log(`Base URL : ${BASE_URL}`);
  console.log("");

  // 1. Fetch existing vals so we can update instead of duplicate-create
  console.log("Fetching existing vals...");
  const allVals = await listMyVals();
  const existingMap = new Map<string, Val>(allVals.map((v) => [v.name, v]));
  console.log(`  Found ${allVals.length} existing val(s) in your account.\n`);

  const deployedVals: Array<{ name: string; url: string }> = [];

  // 2. Deploy each module in order (dependencies first)
  for (const mod of MODULES) {
    console.log(`[${mod.valName}]`);
    let code = await readSource(mod.sourceFile);
    code = rewriteImports(code, username!);

    const val = await upsertVal(existingMap, mod.valName, code, mod.type);

    // Update the map so subsequent modules see any newly created vals
    existingMap.set(mod.valName, val);

    const valUrl = mod.type === "http"
      ? `https://${username}-${mod.valName}.web.val.run`
      : `https://esm.town/v/${username}/${mod.valName}`;

    deployedVals.push({ name: mod.valName, url: valUrl });
    console.log(`  Done. URL: ${valUrl}\n`);
  }

  // 3. Summary
  console.log("=== Deployment complete ===");
  console.log("");
  console.log("Deployed vals:");
  for (const { name, url } of deployedVals) {
    console.log(`  ${name.padEnd(26)} ${url}`);
  }
  console.log("");
  console.log(
    `App entry point: https://${username}-aihive_command.web.val.run`,
  );
  console.log("");
  console.log(
    "Next: open the URL above and go to Settings to configure your API keys.",
  );
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

deploy().catch((err) => {
  console.error("Deployment failed:", err.message ?? err);
  Deno.exit(1);
});
