#!/usr/bin/env bash
# Push local file(s) back to val.town.
# Usage: .vt/push.sh <path> [<path> ...]    paths are relative to the val root (e.g. api/chat.ts)
# Auto-detects new vs. existing files: new -> POST (create), existing -> PUT (update).
# For new files, type defaults to "script". Pass type=http via VT_TYPE env var if needed.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib.sh"

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <relpath> [<relpath> ...]" >&2
  exit 1
fi

# Cache remote file list once
REMOTE_PATHS="$(vt_list | python3 -c '
import json, sys
d = json.load(sys.stdin)
for f in d["data"]:
    if f["type"] != "directory":
        print(f["path"])
')"

for rp in "$@"; do
  lp="$ROOT/$rp"
  if [[ ! -f "$lp" ]]; then
    echo "skip $rp (no local file)" >&2
    continue
  fi
  if grep -qxF "$rp" <<<"$REMOTE_PATHS"; then
    vt_update "$rp" "$lp" > /dev/null
    echo "updated $rp"
  else
    vt_create "$rp" "$lp" "${VT_TYPE:-script}" > /dev/null
    echo "created $rp"
  fi
done
