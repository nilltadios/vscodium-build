#!/usr/bin/env bash
# Replay the previous version's local port patch onto the porting tree (after port-patches.sh).
# Usage: replay-port.sh <patch> <reject-dir>. Rejected hunks are moved to <reject-dir> for port-rejects.mjs.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
patch=$(realpath "${1:?Provide the previous port patch}")
out=$(realpath -m "${2:?Provide the reject directory}")
target=$(cat "$project/work/latest-path.txt")
cd "$target/vscode"
git apply --reject --ignore-whitespace "$patch" || true
mkdir -p "$out"
while IFS= read -r -d '' reject; do
  mkdir -p "$out/$(dirname "$reject")"
  mv "$reject" "$out/$reject"
done < <(find . -name '*.rej' -print0)
printf 'Rejected files: %s\n' "$(find "$out" -name '*.rej' | wc -l)"
