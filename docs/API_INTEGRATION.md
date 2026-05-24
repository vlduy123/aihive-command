# AIHive Command Center — API Integration Guide

This guide covers all 8 external API integrations available in AIHive Command Center. For each integration you will find: what the service is, where to obtain credentials, exactly which fields to fill in the Settings page, which endpoints are available, and common pitfalls to avoid.

---

## Table of Contents

1. [LLM Configuration (Anthropic / OpenAI)](#1-llm-configuration-anthropic--openai)
2. [Ahrefs](#2-ahrefs)
3. [Google Analytics 4](#3-google-analytics-4)
4. [Google Search Console](#4-google-search-console)
5. [LinkedIn](#5-linkedin)
6. [Microsoft Outlook](#6-microsoft-outlook)
7. [WordPress](#7-wordpress)
8. [YouTube](#8-youtube)
9. [Product Hunt](#9-product-hunt)

---

## 1. LLM Configuration (Anthropic / OpenAI)

The LLM configuration powers the AI chat interface throughout AIHive. You must configure at least one provider before the assistant features become active.

**Settings location:** Settings → LLM Configuration

### Fields

| Label | Description |
|---|---|
| Provider | Select: `Anthropic (Claude)`, `OpenAI`, or `Custom` |
| API Key | Your Anthropic or OpenAI secret key |
| Model | e.g. `claude-sonnet-4-6`, `claude-opus-4`, `gpt-4o`, `gpt-4o-mini` |
| Custom Endpoint | (Custom provider only) Your OpenAI-compatible base URL |

### Anthropic (Claude)

1. Go to [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**.
2. Copy the key (it begins with `sk-ant-`). You will not be able to view it again.
3. In Settings → LLM Configuration:
   - **Provider**: `Anthropic (Claude)`
   - **API Key**: paste your `sk-ant-...` key
   - **Model**: `claude-sonnet-4-6` (recommended) or `claude-opus-4`

### OpenAI

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → **Create new secret key**.
2. Copy the key (it begins with `sk-`).
3. In Settings → LLM Configuration:
   - **Provider**: `OpenAI`
   - **API Key**: paste your `sk-...` key
   - **Model**: `gpt-4o` or `gpt-4o-mini`

### Custom (OpenAI-compatible endpoint)

Use this for self-hosted models (Ollama, LM Studio, vLLM, Azure OpenAI, etc.).

1. In Settings → LLM Configuration:
   - **Provider**: `Custom`
   - **API Key**: your endpoint's auth key (or any placeholder if the endpoint is unauthenticated)
   - **Model**: the model name your endpoint expects (e.g. `llama3`, `mistral`)
   - **Custom Endpoint**: the base URL, e.g. `http://localhost:11434/v1` for Ollama

### Gotchas

- Anthropic keys do **not** have a free tier — you need a paid account or prepaid credits.
- OpenAI `gpt-4o` requires a paid account with an active payment method.
- For Custom endpoints the URL must end **without** a trailing slash in most configurations.
- Model names are case-sensitive; `Claude-Sonnet-4-6` will fail where `claude-sonnet-4-6` succeeds.

---

## 2. Ahrefs

Ahrefs is an SEO toolset that provides backlink data, keyword research, domain ratings, and organic traffic estimates.

**Settings location:** Settings → Integrations → Ahrefs

### Credential field

| Settings Label | Backend Key | Value |
|---|---|---|
| API Key | `api_key` | Your Ahrefs API token |

### How to get credentials

1. Log in at [app.ahrefs.com](https://app.ahrefs.com).
2. Go to **Account Settings** → **API** (direct URL: `https://app.ahrefs.com/api`).
3. Click **Generate token** (requires an Ahrefs API subscription — separate from standard plans).
4. Copy the token.

**Required plan:** Ahrefs API access requires an **Enterprise plan** or a dedicated API add-on. Standard Lite/Standard/Advanced plans do not include API access.

### Step-by-step settings entry

1. Open **Settings** → **Integrations** → **Ahrefs**.
2. Paste your token into **API Key**.
3. Save. AIHive will validate the key with a test request.

### Available endpoints

| Endpoint | What it returns |
|---|---|
| `site-explorer` | Overall metrics for a domain (DR, UR, backlinks, referring domains, organic traffic) |
| `keywords` | Keyword data including search volume, difficulty, CPC |
| `backlinks` | Full backlink profile for a target URL or domain |
| `domain-rating` | Domain Rating (DR) score and referring domain count |
| `organic-keywords` | Keywords a domain ranks for organically |

### Example AI chat prompts

- "What is the domain rating of competitor.com?"
- "Show me the top organic keywords for mysite.com"
- "How many backlinks does mysite.com have and where do they come from?"

### Gotchas

- API calls consume **units** from your monthly quota. High-volume queries (full backlink exports) use significantly more units than summary queries.
- The Ahrefs API is **v3** — older v2 endpoints are deprecated.
- Targets must be entered as `domain.com` (no `https://`), or as `https://domain.com/path` for URL-level queries.
- Rate limit: 1 request per second on most plans.

---

## 3. Google Analytics 4

Google Analytics 4 (GA4) provides website traffic analytics including sessions, users, events, conversions, and funnels.

**Settings location:** Settings → Integrations → Google Analytics 4

### Credential fields

| Settings Label | Backend Key | Value |
|---|---|---|
| Access Token | `access_token` | OAuth 2.0 access token |
| Property ID | `extra_config.property_id` | Your GA4 property ID (numeric) |

### How to get credentials

GA4 uses **OAuth 2.0** — you cannot use a simple API key for private data.

**Step 1 — Create a Google Cloud project and enable the API**

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services** → **Library**.
4. Search for **Google Analytics Data API** and click **Enable**.
5. Also enable **Google Analytics Admin API** if you need property management.

**Step 2 — Create OAuth credentials**

1. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
2. Application type: **Web application**.
3. Add your redirect URI (e.g. `http://localhost:3000/oauth/callback` for local dev).
4. Note your **Client ID** and **Client Secret**.

**Step 3 — Obtain an access token**

Run the OAuth consent flow for the Google account that owns the GA4 property. The required scope is:

```
https://www.googleapis.com/auth/analytics.readonly
```

After consent, Google returns an `access_token` (short-lived, ~1 hour) and a `refresh_token` (long-lived). Store both — AIHive uses the refresh token to obtain new access tokens automatically.

**Step 4 — Find your Property ID**

1. Open [analytics.google.com](https://analytics.google.com).
2. Select your GA4 property.
3. Go to **Admin** → **Property Settings**.
4. The **Property ID** is the numeric value shown (e.g. `123456789`). Do **not** include the `properties/` prefix.

### Step-by-step settings entry

1. Open **Settings** → **Integrations** → **Google Analytics 4**.
2. **Access Token**: paste your OAuth access token.
3. **Property ID**: enter the numeric property ID (e.g. `123456789`).
4. Save.

### Available endpoints

| Endpoint | What it returns |
|---|---|
| `realtime` | Real-time active users, top pages, traffic sources (last 30 minutes) |
| `report` | Custom dimension/metric reports over any date range |
| `funnel` | Multi-step conversion funnel analysis (GA4 Data API v1alpha `runFunnelReport`) |

### Example AI chat prompts

- "How many users visited my site in the last 7 days?"
- "What are the top 10 pages by sessions this month?"
- "Show me a funnel from homepage → product page → checkout → purchase"

### Gotchas

- **Access tokens expire after ~1 hour.** AIHive expects a refresh token in `refresh_token` to renew automatically. If you only paste an access token, it will stop working after expiry.
- The **Funnel endpoint** (`funnel`) uses the `v1alpha` version of the Data API, which is subject to breaking changes and requires the same `analytics.readonly` scope.
- The Property ID must be for a **GA4** property, not a Universal Analytics property. UA properties were sunset in July 2024.
- Data sampling can occur on large datasets. Use shorter date ranges or sampler-free methods for accuracy-critical reports.
- The GA4 Data API has a daily quota of 200,000 requests per project and 50,000 per property.

---

## 4. Google Search Console

Google Search Console (GSC) provides search performance data: queries, impressions, clicks, CTR, and average position.

**Settings location:** Settings → Integrations → Google Search Console

### Credential fields

| Settings Label | Backend Key | Value |
|---|---|---|
| Access Token | `access_token` | OAuth 2.0 access token |
| Site URL | `extra_config.site_url` | Your verified GSC property URL |

### How to get credentials

GSC uses the same OAuth 2.0 flow as GA4 and shares the Google Cloud platform.

**Step 1 — Enable the Search Console API**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Library**.
2. Search for **Google Search Console API** and click **Enable**.

**Step 2 — OAuth credentials and access token**

Follow the same OAuth flow as GA4 (see section 3, steps 2–3). The required scope is:

```
https://www.googleapis.com/auth/webmasters.readonly
```

For write operations (submitting sitemaps):

```
https://www.googleapis.com/auth/webmasters
```

**Step 3 — Find your Site URL**

1. Open [search.google.com/search-console](https://search.google.com/search-console).
2. In the property dropdown, note the exact URL of your property.
3. GSC supports two property types:
   - **URL-prefix**: `https://www.example.com/` (include trailing slash)
   - **Domain property**: `sc-domain:example.com` (prefix with `sc-domain:`)

### Step-by-step settings entry

1. Open **Settings** → **Integrations** → **Google Search Console**.
2. **Access Token**: paste your OAuth access token.
3. **Site URL**: enter your property URL exactly as it appears in GSC (e.g. `https://www.example.com/` or `sc-domain:example.com`).
4. Save.

### Available endpoints

| Endpoint | What it returns | API method |
|---|---|---|
| `search-analytics` | Queries, impressions, clicks, CTR, position | `POST searchAnalytics/query` |
| `sitemaps` | List and submit XML sitemaps | `GET/POST sitemaps` |

### Example AI chat prompts

- "What are my top 20 search queries by clicks this week?"
- "Which pages have the highest impressions but lowest CTR?"
- "What is my average ranking position for the keyword 'best coffee maker'?"
- "List all submitted sitemaps for my site"

### Gotchas

- The site URL must **exactly match** the verified property in GSC — including protocol (`http` vs `https`), `www` vs non-`www`, and trailing slash.
- GSC data has a **~2-3 day lag**. Queries for "today" or "yesterday" often return no data.
- Search Analytics data is limited to the **last 16 months**.
- The API returns a maximum of **25,000 rows** per request. Use pagination for large exports.
- Access tokens expire after ~1 hour; provide a refresh token in `refresh_token` for uninterrupted access.
- Domain properties (`sc-domain:`) require DNS verification and cannot be added as URL-prefix properties.

---

## 5. LinkedIn

LinkedIn's API provides access to your professional profile, posts, analytics, and connections.

**Settings location:** Settings → Integrations → LinkedIn

### Credential field

| Settings Label | Backend Key | Value |
|---|---|---|
| Access Token | `access_token` | OAuth 2.0 access token |

### How to get credentials

LinkedIn requires OAuth 2.0. There is no simple API key option for personal data.

**Step 1 — Create a LinkedIn app**

1. Go to [developer.linkedin.com/apps](https://developer.linkedin.com/apps) → **Create app**.
2. Associate the app with a LinkedIn company page (required even for personal use).
3. Note your **Client ID** and **Client Secret** from the **Auth** tab.

**Step 2 — Request required products**

LinkedIn gates API access behind "products." In the **Products** tab of your app, request:

- **Sign In with LinkedIn using OpenID Connect** — for profile access
- **Share on LinkedIn** — for posting
- **Marketing Developer Platform** — for analytics (requires LinkedIn review/approval)

**Step 3 — Configure OAuth redirect URIs**

In the **Auth** tab, add your redirect URI (e.g. `http://localhost:3000/oauth/callback`).

**Step 4 — Run OAuth flow**

Initiate the OAuth 2.0 authorization code flow with the following scopes:

```
openid profile email w_member_social r_liteprofile r_emailaddress
```

For analytics (Marketing Developer Platform):

```
r_organization_social rw_organization_admin r_ads_reporting
```

After consent, exchange the authorization code for an `access_token`.

### Step-by-step settings entry

1. Open **Settings** → **Integrations** → **LinkedIn**.
2. **Access Token**: paste your OAuth access token.
3. Save.

### Available endpoints

| Endpoint | What it returns |
|---|---|
| `profile` | Your LinkedIn profile: name, headline, location, industry |
| `posts` | Your recent posts and their content |
| `analytics` | Post impressions, clicks, engagement rate |
| `connections` | Your 1st-degree connection count and recent connections |

### Example AI chat prompts

- "Draft a LinkedIn post about our new product launch"
- "How did my last 5 posts perform in terms of impressions?"
- "What is my current LinkedIn profile headline?"

### Gotchas

- LinkedIn access tokens expire after **60 days** by default. There is no refresh token for most standard flows — the user must re-authenticate.
- The **Marketing Developer Platform** requires a separate application review by LinkedIn and is generally only available to marketing software companies or agencies.
- LinkedIn's API has strict **rate limits**: 100 calls/day for most endpoints in development mode, higher in production after review.
- The LinkedIn API **v2** is current. Avoid any documentation referencing v1 endpoints (deprecated).
- Personal profile data is limited — you cannot access another user's posts or analytics without their explicit OAuth consent.
- Posting on behalf of a member requires the `w_member_social` scope AND the **Share on LinkedIn** product to be approved.

---

## 6. Microsoft Outlook

The Microsoft Graph API provides access to your Outlook email, calendar, and contacts.

**Settings location:** Settings → Integrations → Outlook

### Credential field

| Settings Label | Backend Key | Value |
|---|---|---|
| Access Token (Microsoft OAuth) | `access_token` | Microsoft OAuth 2.0 access token |

### How to get credentials

**Step 1 — Register an Azure app**

1. Go to [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**.
2. Name your app, select **Accounts in any organizational directory and personal Microsoft accounts** for broad compatibility.
3. Add your redirect URI under **Authentication** → **Platform: Web**.
4. Note your **Application (client) ID** and **Directory (tenant) ID**.
5. Under **Certificates & secrets** → **New client secret** — note the secret value immediately.

**Step 2 — Configure API permissions**

In **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**, add:

| Permission | Purpose |
|---|---|
| `Mail.Read` | Read email messages |
| `Mail.Send` | Send email |
| `Calendars.ReadWrite` | Read and write calendar events |
| `Contacts.Read` | Read contacts |
| `offline_access` | Get refresh tokens for persistent access |

Click **Grant admin consent** if you are a tenant admin.

**Step 3 — Run OAuth flow**

Use the Microsoft identity platform OAuth 2.0 authorization code flow:

```
https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
```

Scopes:

```
openid offline_access Mail.Read Mail.Send Calendars.ReadWrite Contacts.Read
```

Exchange the code for tokens at:

```
https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
```

### Step-by-step settings entry

1. Open **Settings** → **Integrations** → **Outlook**.
2. **Access Token (Microsoft OAuth)**: paste your Microsoft OAuth access token.
3. Save. Store the refresh token in `refresh_token` for automatic renewal.

### Available endpoints

| Endpoint | What it returns |
|---|---|
| `messages/inbox` | Email messages from your inbox |
| `send` | Send a new email message |
| `calendar` | Calendar events (list, create, update) |
| `contacts` | Address book contacts |

### Example AI chat prompts

- "Show me my unread emails from today"
- "Draft a reply to the email from John about the Q3 report"
- "What meetings do I have tomorrow?"
- "Add a meeting called 'Product Review' for next Monday at 2pm"

### Gotchas

- Microsoft access tokens expire after **1 hour**. Always store and provide the `refresh_token` for seamless renewal.
- Personal Microsoft accounts (`@outlook.com`, `@hotmail.com`) support the **consumer** endpoint (`common` or `consumers` tenant). Work accounts use the organization tenant ID.
- Admin consent is required for many Graph permissions when the app is used in a corporate tenant. Users may see a "Need admin approval" error otherwise.
- The Graph API uses **pagination** (`@odata.nextLink`) for large result sets. AIHive handles this internally, but expect slower responses for large mailboxes.
- Sending email via the `send` endpoint requires the sender address to match the authenticated account.
- Microsoft throttles requests to **10,000 requests per 10 minutes** per app per tenant.

---

## 7. WordPress

WordPress REST API enables reading and writing posts, pages, media, and categories on a self-hosted WordPress site.

**Settings location:** Settings → Integrations → WordPress

### Credential fields

| Settings Label | Backend Key | Value |
|---|---|---|
| Site URL | `extra_config.site_url` | Your WordPress site's base URL |
| Username/Application Password | `api_key` | Your WordPress username |
| Password/API Secret | `api_secret` | Application Password (not your login password) |

### How to get credentials

WordPress REST API supports **Application Passwords** — a per-application credential that does not expose your main login password.

**Step 1 — Enable Application Passwords**

Application Passwords are built into WordPress 5.6+. No plugin required.

1. Log in to your WordPress dashboard.
2. Go to **Users** → **Profile** (or **Users** → **Edit** for another user).
3. Scroll to the **Application Passwords** section near the bottom.
4. Enter a name for the application (e.g. `AIHive`) and click **Add New Application Password**.
5. Copy the generated password immediately — it is shown only once. It looks like: `xxxx xxxx xxxx xxxx xxxx xxxx` (spaces are part of the format; include or omit them, both work).

**Step 2 — Find your Site URL**

Use the base URL of your WordPress site without a trailing slash, e.g.:

- `https://mysite.com`
- `https://mysite.com/blog` (if WordPress is in a subdirectory)

The REST API endpoint will be at `{site_url}/wp-json/wp/v2/`.

### Step-by-step settings entry

1. Open **Settings** → **Integrations** → **WordPress**.
2. **Site URL**: enter your WordPress base URL (e.g. `https://mysite.com`).
3. **Username/Application Password** (`api_key`): enter your WordPress **username** (not email).
4. **Password/API Secret** (`api_secret`): enter the **Application Password** generated in step 1.
5. Save. AIHive authenticates using HTTP Basic Auth with these credentials.

### Available endpoints

| Endpoint | What it returns / does |
|---|---|
| `posts` | List, read, and create blog posts |
| `pages` | List, read, and create pages |
| `media` | Upload and manage media files |
| `categories` | List and manage post categories |
| `publish-post` | Set a post's status to `publish` (makes it live) |

### Example AI chat prompts

- "Draft a blog post about 5 SEO tips and publish it to WordPress"
- "List my last 10 published posts"
- "Create a new draft titled 'Q2 Marketing Recap'"
- "What categories do I have on my WordPress site?"

### Gotchas

- **Application Passwords require HTTPS.** WordPress disables them over plain HTTP to prevent credential interception. Your site must have a valid SSL certificate.
- If you host on **WordPress.com** (not self-hosted), the REST API endpoint and authentication differ. WordPress.com uses OAuth 2.0 via the Jetpack/WP.com API — the settings above apply to self-hosted only.
- The user whose credentials you enter must have the **Editor** or **Administrator** role to create and publish posts. Contributor role can only create drafts.
- Multisite WordPress installations may require additional configuration — the API endpoint may be per-site (e.g. `https://mysite.com/blog/wp-json/wp/v2/`).
- Large media uploads are subject to your server's `upload_max_filesize` and `post_max_size` PHP settings, not the API itself.
- The `REST API` must not be disabled by a security plugin (e.g. Wordfence, iThemes Security). Some hosts disable it by default.

---

## 8. YouTube

YouTube Data API v3 provides access to channel stats, video metadata, playlists, and search. YouTube Analytics API provides revenue, watch time, and audience data (requires OAuth).

**Settings location:** Settings → Integrations → YouTube

### Credential fields

| Settings Label | Backend Key | When to use |
|---|---|---|
| API Key (public data) | `api_key` | Public channel/video data only (no auth needed) |
| Access Token (private data/analytics) | `access_token` | Private data, upload, and YouTube Analytics |

You can configure both. AIHive uses the API Key for public queries and falls back to the Access Token for analytics and private content.

### How to get credentials

**For public data — API Key**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Library**.
2. Search for **YouTube Data API v3** and click **Enable**.
3. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **API key**.
4. Copy the API key. Optionally, restrict it to the YouTube Data API to improve security.

**For private data and analytics — OAuth 2.0**

1. Enable both **YouTube Data API v3** and **YouTube Analytics API** in the Google Cloud Console.
2. Create an OAuth 2.0 client ID (see GA4 section, steps 2–3, same flow).
3. Required scopes:

```
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/yt-analytics.readonly
```

For uploads/write access:

```
https://www.googleapis.com/auth/youtube
```

4. Run the OAuth consent flow and obtain an `access_token` and `refresh_token`.

### Step-by-step settings entry

1. Open **Settings** → **Integrations** → **YouTube**.
2. **API Key** (optional, for public data): paste your API key from Google Cloud.
3. **Access Token** (optional, for analytics): paste your OAuth access token.
4. Save. Store the refresh token in `refresh_token` for automatic renewal.

### Available endpoints

| Endpoint | What it returns | Auth required |
|---|---|---|
| `channels` | Channel statistics: subscribers, view count, video count | API Key or OAuth |
| `videos` | Video metadata: title, description, views, likes, duration | API Key or OAuth |
| `playlists` | Playlist details and video lists | API Key or OAuth |
| `search` | Search YouTube for videos, channels, playlists | API Key or OAuth |
| `analytics` | Watch time, revenue, impressions, demographics | OAuth only |

### Example AI chat prompts

- "How many subscribers does my YouTube channel have?"
- "What are my top 5 videos by view count?"
- "Show me watch time and impressions for the last 30 days"
- "Search YouTube for videos about 'React hooks tutorial'"

### Gotchas

- The YouTube Data API v3 has a **quota of 10,000 units per day** per Google Cloud project. Each request type costs different units (e.g., a search costs 100 units; reading video details costs 1 unit per video). This quota is shared across all apps using the same project.
- **Analytics data** (watch time, revenue, demographics) requires OAuth — the API Key alone is insufficient.
- Revenue data (`estimatedRevenue`) is only available to **YouTube Partner Program** members with monetized channels.
- Access tokens expire after **1 hour**. Provide a `refresh_token` to avoid re-authentication.
- If your OAuth app is in "Testing" mode in Google Cloud Console, only **test users** you explicitly add can authenticate. Publish the app to allow any YouTube account.
- The YouTube search endpoint costs 100 quota units per request and is the most expensive operation. Cache results where possible.
- Channel IDs look like `UCxxxxxx...`. Your channel URL may show a handle (`@mychannel`) — use the API to resolve the handle to a channel ID if needed.

---

## 9. Product Hunt

Product Hunt API v2 (GraphQL) provides access to product launches, topics, and community data.

**Settings location:** Settings → Integrations → Product Hunt

### Credential field

| Settings Label | Backend Key | Value |
|---|---|---|
| API Key (Developer Token) | `api_key` | Your Product Hunt API token |

### How to get credentials

1. Log in at [producthunt.com](https://www.producthunt.com).
2. Go to [api.producthunt.com/v2/oauth/applications](https://api.producthunt.com/v2/oauth/applications).
3. Click **Add an Application**.
4. Fill in the app name, description, and redirect URI (use `http://localhost:3000` if you just want a developer token).
5. After creating the app, go to the app's detail page and click **Create Developer Token**.
6. Copy the token.

**Note:** Developer Tokens are tied to your Product Hunt account and grant access to public data. For actions on behalf of other users, a full OAuth flow is required, but AIHive uses developer tokens for read-only data access.

### Step-by-step settings entry

1. Open **Settings** → **Integrations** → **Product Hunt**.
2. **API Key (Developer Token)**: paste your developer token.
3. Save.

### Available endpoints

| Endpoint | What it returns |
|---|---|
| `posts` | Product launches: name, tagline, vote count, comments, makers |
| `topics` | Product Hunt topics/categories and trending products within them |

### Example AI chat prompts

- "What are today's top 10 products on Product Hunt?"
- "Show me the top products in the AI category this week"
- "What product launched on Product Hunt with the most upvotes today?"
- "List recent Product Hunt launches in the 'Developer Tools' topic"

### Gotchas

- Product Hunt API v2 is **GraphQL**, not REST. AIHive handles query construction internally — you do not need to write GraphQL queries yourself.
- Developer Tokens do **not expire**, but they can be revoked manually from the Product Hunt API dashboard.
- The API is **rate-limited**. Avoid running many queries in rapid succession. The exact rate limit is not publicly documented, but in practice requests over ~60/minute may be throttled.
- Product Hunt data is **public** — you can access any product's vote count, makers, and description without special permissions.
- Posting a product or voting requires a full OAuth token tied to a user account, not a developer token. AIHive's Product Hunt integration is currently **read-only**.
- Some older Product Hunt API v1 documentation circulates online — it is fully deprecated. All AIHive calls use v2 (`api.producthunt.com/v2/api/graphql`).

---

## Quick Reference — All Settings Fields

| Integration | Settings Label | Backend Key |
|---|---|---|
| Ahrefs | API Key | `api_key` |
| Google Analytics 4 | Access Token | `access_token` |
| Google Analytics 4 | Property ID | `extra_config.property_id` |
| Google Search Console | Access Token | `access_token` |
| Google Search Console | Site URL | `extra_config.site_url` |
| LinkedIn | Access Token | `access_token` |
| Outlook | Access Token (Microsoft OAuth) | `access_token` |
| WordPress | Site URL | `extra_config.site_url` |
| WordPress | Username/Application Password | `api_key` |
| WordPress | Password/API Secret | `api_secret` |
| YouTube | API Key (public data) | `api_key` |
| YouTube | Access Token (private data/analytics) | `access_token` |
| Product Hunt | API Key (Developer Token) | `api_key` |

---

## Backend Credential Storage Schema

AIHive stores all credentials per integration using the following fields:

```
api_key         — API key, developer token, or username
api_secret      — API secret, application password, or client secret
access_token    — OAuth 2.0 short-lived access token
refresh_token   — OAuth 2.0 long-lived refresh token (for auto-renewal)
extra_config    — JSON object for additional fields (property_id, site_url, etc.)
```

Example `extra_config` values:

```json
// Google Analytics 4
{ "property_id": "123456789" }

// Google Search Console
{ "site_url": "https://www.example.com/" }

// WordPress
{ "site_url": "https://mywordpresssite.com" }
```

---

## Troubleshooting Common Errors

| Error | Likely Cause | Fix |
|---|---|---|
| `401 Unauthorized` | Expired or invalid access token | Re-authenticate and update the access token |
| `403 Forbidden` | Missing OAuth scope or insufficient plan | Add the required scope to your OAuth app; check plan level |
| `429 Too Many Requests` | Rate limit exceeded | Wait and retry; reduce query frequency |
| `Invalid property_id` (GA4) | Wrong format or wrong property type | Use numeric GA4 property ID only; not UA |
| `Site URL not verified` (GSC) | URL doesn't match GSC property exactly | Copy URL exactly from GSC property dropdown |
| `Application Passwords disabled` (WordPress) | HTTP site or security plugin blocking | Ensure HTTPS; check security plugin settings |
| `Quota exceeded` (YouTube) | Daily 10,000 unit quota consumed | Wait until quota resets at midnight Pacific; or create a new GCP project |
| `Token expired` | Access token > 1 hour old | Provide `refresh_token`; AIHive will auto-renew |
