# AIHive Command Center

> All-in-one marketing & sales platform with AI agents — hosted on val.town

## Features

- **Marketing Workspace** — Ahrefs SEO, Google Analytics 4, Search Console, WordPress, YouTube, Product Hunt
- **Sales Workspace** — LinkedIn outreach, Outlook email management
- **Agent Studio** — Create and manage AI agents per workspace; AI can create agents on your command
- **Configurable LLM** — Connect any LLM: Anthropic Claude, OpenAI, or any OpenAI-compatible API
- **Live Dashboard** — Real-time overview of all connected services
- **AI Chat** — Floating assistant that can query all your data, execute tasks, and build agents

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/aihive-command.git
cd aihive-command
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set VALTOWN_TOKEN and VALTOWN_USERNAME at minimum
```

### 3. Deploy to val.town

```bash
export VALTOWN_TOKEN=your_token
export VALTOWN_USERNAME=your_username
deno run --allow-net --allow-env --allow-read deploy/deploy.ts
```

The deployer will:
- Read each source module
- Rewrite local imports to `esm.town` URLs
- Create or update the nine val.town vals that make up the app
- Print the live URL when finished

### 4. Open the app

```
https://YOUR_USERNAME-aihive_command.web.val.run
```

### 5. Configure integrations

Navigate to **Settings** in the sidebar to add API keys for each service you want to connect.

---

## Integration Setup Guides

### Ahrefs

1. Log in at [ahrefs.com](https://ahrefs.com)
2. Go to **Account** → **API**
3. Generate an API key
4. In AIHive: **Settings** → **Ahrefs** → paste key → Save

### Google Analytics 4 (GA4)

1. Open [Google Cloud Console](https://console.cloud.google.com) and create a project
2. Enable the **Analytics Data API**
3. Create **OAuth 2.0** credentials (Web application type)
4. Complete the OAuth flow to obtain an access token
5. Find your **Property ID** in GA4 Admin → Property Settings
6. In AIHive: **Settings** → **GA4** → paste Access Token + Property ID → Save

### Google Search Console (GSC)

1. Use the same Google Cloud project as GA4
2. Enable the **Search Console API**
3. Verify site ownership at [search.google.com/search-console](https://search.google.com/search-console)
4. Note your verified **Site URL** (e.g., `https://example.com`)
5. In AIHive: **Settings** → **GSC** → paste Access Token + Site URL → Save

### LinkedIn

1. Go to [linkedin.com/developers](https://www.linkedin.com/developers) → **Create App**
2. Under **Auth**, add these OAuth 2.0 scopes:
   - `r_liteprofile`
   - `r_emailaddress`
   - `w_member_social`
3. Complete the OAuth flow to get an access token
4. In AIHive: **Settings** → **LinkedIn** → paste token → Save

### Microsoft Outlook

1. Go to [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Click **New registration**, choose **Web** platform
3. Under **API permissions**, add Microsoft Graph permissions:
   - `Mail.Read`
   - `Mail.Send`
   - `Calendars.Read`
4. Grant admin consent for your tenant
5. Complete the OAuth2 authorization code flow to obtain an access token
6. In AIHive: **Settings** → **Outlook** → paste token → Save

### WordPress

1. Log in to your WordPress admin dashboard
2. Go to **Users** → **Profile** → scroll to **Application Passwords**
3. Enter a name (e.g., "AIHive") and click **Add New Application Password**
4. Copy the generated password
5. In AIHive: **Settings** → **WordPress** → enter Site URL, Username, and App Password → Save

> Note: Application Passwords require WordPress 5.6+ and HTTPS on your site.

### YouTube

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **YouTube Data API v3**
3. Create an **API key** (for public data) or use the OAuth token from GA4 setup (for private data / channel management)
4. In AIHive: **Settings** → **YouTube** → paste API key → Save

### Product Hunt

1. Go to [producthunt.com/v2/oauth/applications](https://www.producthunt.com/v2/oauth/applications)
2. Create a new application
3. Copy the **API Key**
4. In AIHive: **Settings** → **Product Hunt** → paste key → Save

---

## LLM Configuration

AIHive supports any of the following LLM providers:

| Provider | Setting | Recommended Model |
|---|---|---|
| Anthropic Claude | `anthropic` | `claude-sonnet-4-6` |
| OpenAI | `openai` | `gpt-4o` |
| Custom (OpenAI-compatible) | `custom` | _(your model)_ |

### Configure in-app

**Settings** → **LLM Configuration**:

1. Select provider
2. Enter API key
3. Enter model name
4. (Custom only) Enter base URL of your endpoint
5. Click **Save**

### Configure via environment

Set these as val.town Environment Variables in your val settings dashboard:

```
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-sonnet-4-6
```

---

## Agent System

AIHive ships with six pre-built agents:

### Marketing Agents

| Agent | Tools | Description |
|---|---|---|
| SEO Analyst | Ahrefs, GSC | Keyword research, backlink audits, rank tracking |
| Content Creator | WordPress, YouTube | Draft posts, schedule content, manage media |
| Analytics Reporter | GA4, GSC | Traffic reports, conversion funnels, search performance |

### Sales Agents

| Agent | Tools | Description |
|---|---|---|
| LinkedIn Outreach | LinkedIn | Prospect search, connection requests, message drafts |
| Lead Researcher | LinkedIn, Product Hunt | Company intelligence, founder profiles, funding data |
| Email Composer | Outlook | Draft cold emails, follow-ups, meeting requests |

### Creating Custom Agents via AI Chat

Open the chat panel (bottom-right) and describe what you need:

> "Create a marketing agent that monitors Product Hunt for new AI tools every morning and drafts a LinkedIn post about the top launch."

The AI will create, name, and configure the agent automatically. You can then view and edit it in **Agent Studio**.

### Agent Studio

- Browse all agents in the **Agent Studio** tab
- Edit agent name, description, and tool access
- Enable / disable agents per workspace
- View agent run history and outputs

---

## Architecture

```
aihive-command/
├── main.ts               # HTTP entry point (val type: http)
├── router.ts             # Request routing — maps paths to handlers
├── types.ts              # Shared TypeScript interfaces & enums
├── db.ts                 # SQLite schema, migrations, seed data
├── frontend.ts           # Complete React 18 SPA (returned as HTML)
├── api/
│   ├── agents.ts         # Agent CRUD: list, create, update, delete
│   ├── llm.ts            # LLM config storage + unified callLLM()
│   ├── integrations.ts   # Proxy handlers for all 8 integrations
│   └── chat.ts           # AI chat with tool-use and agent creation
└── deploy/
    └── deploy.ts         # Deno deployment script
```

### Val.town Module Graph

```
aihive_command (http)
    └── aihive_router
            ├── aihive_agents
            │       └── aihive_db
            ├── aihive_llm
            │       └── aihive_db
            ├── aihive_integrations
            │       └── aihive_db
            ├── aihive_chat
            │       ├── aihive_llm
            │       ├── aihive_agents
            │       └── aihive_integrations
            └── aihive_frontend
```

Each node is a separate val deployed to `esm.town` and imported by URL. The entry point `aihive_command` is the only HTTP val; all others are script vals.

### Database Schema

AIHive uses val.town's built-in SQLite (`@std/sqlite`):

| Table | Purpose |
|---|---|
| `agents` | Agent definitions (name, description, tools, workspace) |
| `agent_runs` | Execution history per agent |
| `integrations` | Encrypted credential storage per integration |
| `llm_config` | Active LLM provider settings |
| `chat_sessions` | Chat thread history |

### Frontend Stack

- **React 18** — loaded from CDN (`esm.sh`)
- **Tailwind CSS** — loaded from CDN (Play CDN)
- **Lucide Icons** — SVG icon library
- Single-file SPA served as `text/html` from `aihive_frontend`

---

## Development

### Local testing with Deno

```bash
# Run the HTTP server locally (without val.town)
VALTOWN_TOKEN=stub deno run --allow-net --allow-env --allow-read main.ts
```

### Redeploying after changes

```bash
deno run --allow-net --allow-env --allow-read deploy/deploy.ts
```

The deployer is idempotent — it updates existing vals rather than creating duplicates.

### Adding a new integration

1. Add credential fields to `types.ts` (`IntegrationConfig`)
2. Add a proxy handler in `api/integrations.ts`
3. Register the route in `router.ts`
4. Add a settings panel in `frontend.ts`
5. Redeploy

---

## Troubleshooting

### "VALTOWN_TOKEN env var required"
Make sure you've exported `VALTOWN_TOKEN` in your shell before running the deploy script.

### "Failed to create val (409)"
A val with that name already exists under a different account. Change `VALTOWN_USERNAME` or rename the val in deploy.ts.

### Integration returns 401 / Unauthorized
Your OAuth access token has expired. Re-run the OAuth flow for that service and update the token in Settings.

### LLM chat returns empty response
Check that `LLM_API_KEY` is set correctly in val.town Environment Variables and that the model name matches the provider's naming convention.

### App shows blank page
Open browser DevTools → Console. If you see a CORS error, ensure the val is set to **Public** in your val.town dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Deno (via val.town) |
| Database | SQLite (val.town built-in `@std/sqlite`) |
| Frontend | React 18 (CDN), Tailwind CSS (CDN), Lucide Icons |
| AI | Configurable: Anthropic Claude / OpenAI / Custom |
| Hosting | val.town (free tier supports this app) |
| Deployment | Deno script (`deploy/deploy.ts`) |

---

## License

MIT — see [LICENSE](LICENSE) for details.
