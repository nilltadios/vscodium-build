#!/usr/bin/env bash
# Three-way merge of files whose rejected hunks port-rejects.mjs could not place:
#   ours = 1.141.2 fully patched tree, base = 1.141.2 pristine, theirs = 1.142.0 pristine.
# Writes the merge into the porting tree; prints conflict counts (conflict markers left in place).
set -uo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=$(cat "$project/work/latest-path.txt")/vscode
ours=$(cat "$project/../1.141.2/work/latest-path.txt")/vscode
base=$project/../1.141.2/sources/vscode
theirs=$project/sources/vscode
for file in "$@"; do
  if [[ ! -f $ours/$file ]]; then  # removed by the 1.141.2 port
    rm -f "$target/$file"; printf 'REMOVED\t%s\n' "$file"; continue
  fi
  git merge-file -p -L 1.141.2-port -L 1.141.2 -L 1.142.0 "$ours/$file" "$base/$file" "$theirs/$file" > "$target/$file"
  printf '%s\t%s\n' "$?" "$file"
done
