#!/usr/bin/env bash
# Replay the 1.141.2 local port patch onto the 1.142.0 porting tree (after port-patches.sh).
# Rejected hunks go to evidence/rejects-port-1.141.2/ for manual or scripted resolution.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=${1:-$(cat "$project/work/latest-path.txt")}
patch="$project/evidence/patches-1.141.2-reference/rebased/user/zzzz-port-1.141.2.patch"
out="$project/evidence/rejects-port-1.141.2"
cd "$target/vscode"
git apply --reject --ignore-whitespace "$patch" || true
mkdir -p "$out"
while IFS= read -r -d '' reject; do
  mkdir -p "$out/$(dirname "$reject")"
  mv "$reject" "$out/$reject"
done < <(find . -name '*.rej' -print0)
printf 'Rejected files: %s\n' "$(find "$out" -name '*.rej' | wc -l)"
