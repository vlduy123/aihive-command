# .vt — Val Town REST helpers

Direct REST-API wrappers for editing the `aihivecommand` val on val.town, file-by-file. Use these when the live val has drifted from `val.town/` in this repo and you want to sync.

Bypasses the `vt` CLI (which installs from JSR — Cloudflare-blocked from some networks) and the `deploy/deploy.ts` script (which targets the older per-module val deployment model, not the current single multi-file val).

## Setup

Save your val.town API token to `~/.val-town-token` (mode 600). Get one from https://www.val.town/settings/api.

```bash
umask 077 && printf 'vtwn_yourtoken' > ~/.val-town-token
```

`config.env` already has the val/branch IDs filled in.

## Commands (run from repo root)

```bash
.vt/pull.sh                          # pull every remote file → val.town/*
.vt/pull.sh main.ts api/chat.ts      # pull specific paths
.vt/push.sh router.ts                # push one (auto-detects create vs. update)
.vt/push.sh api/chat.ts api/llm.ts   # push several
VT_TYPE=http .vt/push.sh foo.ts      # push new HTTP-trigger file
.vt/delete.sh some/path.ts           # delete remote file
.vt/delete.sh some/dir --recursive   # delete remote dir
```

Paths are relative to `val.town/` (the source root in this repo).

## Quirks

- Identical-content `push` calls are deduped server-side — no version bump, no error.
- The val is a single multi-file val (`v2 /vals/{id}/files` API). Don't confuse with the older `deploy/deploy.ts` script that fans out to per-module vals.

## Files

- `lib.sh` — shared helpers (`vt_get_content`, `vt_list`, `vt_update`, `vt_create`, `vt_delete`)
- `pull.sh` / `push.sh` / `delete.sh` — user-facing commands
- `config.env` — val ID, branch ID, source dir (`val.town`), endpoint URL
