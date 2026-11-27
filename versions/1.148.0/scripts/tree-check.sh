#!/usr/bin/env bash
# Compare a tree prepared from the exported patch set with the porting tree it was exported from.
# Usage: tree-check.sh <port-vscode-dir> <check-vscode-dir>. Ignores .git, dependencies, and directories left
# empty by pruning (git does not track empty directories). Exit 0 when they match.
set -uo pipefail
port=$(realpath "${1:?Provide the porting vscode directory}")
check=$(realpath "${2:?Provide the check vscode directory}")
differences=$(diff -rq --no-dereference -x .git -x node_modules -x .build "$port" "$check" |
  while IFS= read -r line; do
    if [[ $line =~ ^Only\ in\ (.+):\ (.+)$ ]]; then
      entry="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
      [[ -d $entry && -z $(find "$entry" -type f -print -quit) ]] && continue
    fi
    printf '%s\n' "$line"
  done)
if [[ -n $differences ]]; then
  printf '%s\n' "$differences" | head -n 40
  printf 'FAIL: the exported patch set does not reproduce the porting tree (%s difference(s)).\n' "$(printf '%s\n' "$differences" | wc -l)"
  exit 1
fi
printf 'PASS: the exported patch set reproduces the porting tree.\n'
