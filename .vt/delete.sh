#!/usr/bin/env bash
# Delete a file from val.town (does NOT touch local copy).
# Usage: .vt/delete.sh <relpath> [--recursive]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib.sh"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <relpath> [--recursive]" >&2
  exit 1
fi

rec="false"
[[ "${2:-}" == "--recursive" ]] && rec="true"

vt_delete "$1" "$rec"
echo "deleted $1 (recursive=$rec)"
