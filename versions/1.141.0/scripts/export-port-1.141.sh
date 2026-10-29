#!/usr/bin/env bash
# Export all post-patch 1.141.0 resolutions in the porting tree (port-rejects, prune-providers,
# finalize-port-1.141*, refresh-locks) as the last user patch, then refresh the patch hash manifest.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=${1:-$(cat "$project/work/latest-path.txt")}
out="$project/patches/rebased/user/zzzz-port-1.141.0.patch"
git -C "$target/vscode" diff --binary > "$out"
test -s "$out"
find "$project/patches/rebased" -type f -print0 | sort -z | xargs -0 sha256sum > "$project/evidence/port-patches.sha256"
printf 'Exported %s (%s files)\n' "$out" "$(grep -c '^diff --git' "$out")"
