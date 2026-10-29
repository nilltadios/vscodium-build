#!/usr/bin/env bash
# Export every post-patch resolution in the porting tree (port-rejects, merge-from, prune-providers,
# finalize-port-<version>.mjs, port-rules.mjs, refresh-locks) as the last user patch, then refresh the patch
# hash manifest. Usage: export-port.sh [work-directory]
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=${1:-$(cat "$project/work/latest-path.txt")}
version=$(jq -r .vscode_version "$project/config.json")
out="$project/patches/rebased/user/zzzz-port-$version.patch"
mkdir -p "$(dirname "$out")"
cd "$target/vscode"
# The index holds the tree after the rebased patches (port-patches.sh ends with git add -A). Stage the port's
# changes, including new and deleted files, in a throwaway index and diff it against that baseline, so the
# real index is left alone. (git add -N would stage deletions in the real index and drop them from the diff.)
baseline=$(git write-tree)
index=$(mktemp); trap 'rm -f "$index"' EXIT
GIT_INDEX_FILE=$index git read-tree "$baseline"
GIT_INDEX_FILE=$index git add -A -- . ':!*.rej' ':!*.orig'
GIT_INDEX_FILE=$index git diff --binary --cached "$baseline" > "$out"
if [[ ! -s $out ]]; then
  # A VSCodium rebase whose patches need no local fixes has nothing to export.
  [[ $(jq -r '.mode // "port"' "$project/port.json") == vscodium-rebase ]] || { printf 'Empty port patch\n' >&2; exit 1; }
  rm -f "$out"
fi
find "$project/patches/rebased" -type f -print0 | sort -z | xargs -0 sha256sum > "$project/evidence/port-patches.sha256"
if [[ -f $out ]]; then printf 'Exported %s (%s files)\n' "$out" "$(grep -c '^diff --git' "$out")"; else printf 'Exported nothing: no local fixes on top of the patch set.\n'; fi
