#!/usr/bin/env bash
# Pull all files from val.town into the local working dir.
# Usage: .vt/pull.sh [path1 path2 ...]   (omit to pull everything)
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib.sh"

paths=("$@")
if [[ ${#paths[@]} -eq 0 ]]; then
  mapfile -t paths < <(
    vt_list | python3 -c '
import json, sys
d = json.load(sys.stdin)
for f in d["data"]:
    if f["type"] != "directory":
        print(f["path"])
'
  )
fi

for p in "${paths[@]}"; do
  mkdir -p "$ROOT/$(dirname "$p")"
  vt_get_content "$p" > "$ROOT/$p"
  echo "pulled $p"
done
