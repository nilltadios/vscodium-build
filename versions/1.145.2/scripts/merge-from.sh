#!/usr/bin/env bash
# Three-way merge of files whose rejected hunks port-rejects.mjs could not place:
#   ours = previous version's fully patched tree, base = previous pristine, theirs = new pristine.
# Usage: merge-from.sh <prev-workspace> <file>...   Prints "<conflicts>\t<file>" (git merge-file's exit status:
# the number of conflicts, conflict markers left in place), REMOVED (the previous port deleted the file) or
# DELETED-UPSTREAM (gone from the new release; left absent).
set -uo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
prev_dir=$(realpath "${1:?Provide the previous version workspace}"); shift
prev=$(jq -r .vscode_version "$prev_dir/config.json")
next=$(jq -r .vscode_version "$project/config.json")
target=$(cat "$project/work/latest-path.txt")/vscode
ours=$(cat "$prev_dir/work/latest-path.txt")/vscode
base=$prev_dir/sources/vscode
theirs=$project/sources/vscode
empty=$(mktemp); trap 'rm -f "$empty"' EXIT
for file in "$@"; do
  if [[ ! -f $ours/$file ]]; then rm -f "$target/$file"; printf 'REMOVED\t%s\n' "$file"; continue; fi
  if [[ ! -f $theirs/$file ]]; then printf 'DELETED-UPSTREAM\t%s\n' "$file"; continue; fi
  base_file=$base/$file; [[ -f $base_file ]] || base_file=$empty
  mkdir -p "$(dirname "$target/$file")"
  git merge-file -p -L "$prev-port" -L "$prev" -L "$next" "$ours/$file" "$base_file" "$theirs/$file" > "$target/$file"
  printf '%s\t%s\n' "$?" "$file"
done
