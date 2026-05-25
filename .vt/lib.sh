#!/usr/bin/env bash
# Shared helpers for val.town REST API. Source this from other scripts.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/config.env"
ROOT="$(cd "$HERE/../${SOURCE_DIR:-.}" && pwd)"

if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "ERROR: token file $TOKEN_FILE not found. Create it with your val.town API token (chmod 600)." >&2
  exit 1
fi
TOKEN="$(cat "$TOKEN_FILE")"

# urlencode a single value (uses python3 — present on macOS by default)
urlenc() {
  python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

# vt_get_content <remote_path>            → stdout = file content
vt_get_content() {
  local p; p="$(urlenc "$1")"
  curl -fsSL -H "Authorization: Bearer $TOKEN" \
    "$API_BASE/vals/$VAL_ID/files/content?path=$p&branch_id=$BRANCH_ID"
}

# vt_list                                  → JSON listing of all files (recursive)
vt_list() {
  curl -fsSL -H "Authorization: Bearer $TOKEN" \
    "$API_BASE/vals/$VAL_ID/files?path=&recursive=true&limit=100&branch_id=$BRANCH_ID"
}

# vt_update <remote_path> <local_path>     → PUT (modify existing file)
vt_update() {
  local rp="$1" lp="$2"
  local name; name="$(basename "$rp")"
  local p; p="$(urlenc "$rp")"
  python3 - "$lp" "$name" <<'PY' > /tmp/vt_body.json
import json, sys
local, name = sys.argv[1], sys.argv[2]
with open(local, 'r', encoding='utf-8') as f:
    content = f.read()
print(json.dumps({"content": content, "name": name}))
PY
  curl -fsSL -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    --data-binary @/tmp/vt_body.json \
    "$API_BASE/vals/$VAL_ID/files?path=$p&branch_id=$BRANCH_ID"
}

# vt_create <remote_path> <local_path> [type]   → POST (new file)
# type defaults to "script"; use "http" for HTTP-trigger entrypoints
vt_create() {
  local rp="$1" lp="$2" type="${3:-script}"
  local p; p="$(urlenc "$rp")"
  python3 - "$lp" "$type" <<'PY' > /tmp/vt_body.json
import json, sys
local, t = sys.argv[1], sys.argv[2]
with open(local, 'r', encoding='utf-8') as f:
    content = f.read()
print(json.dumps({"content": content, "type": t}))
PY
  curl -fsSL -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    --data-binary @/tmp/vt_body.json \
    "$API_BASE/vals/$VAL_ID/files?path=$p&branch_id=$BRANCH_ID"
}

# vt_delete <remote_path> [recursive=false]
vt_delete() {
  local rp="$1" recursive="${2:-false}"
  local p; p="$(urlenc "$rp")"
  curl -fsSL -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    "$API_BASE/vals/$VAL_ID/files?path=$p&recursive=$recursive&branch_id=$BRANCH_ID"
}
