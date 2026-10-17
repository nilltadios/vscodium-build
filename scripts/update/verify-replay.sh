#!/usr/bin/env bash
# Regression test for the update driver: replay a finished port with update.sh and compare it with the original.
# Usage: bash scripts/update/verify-replay.sh [prev=1.141.2] [new=1.142.0] [workspace=versions/<new>-replay]
# Creates the workspace if it does not exist (needs versions/<prev> with its patched work tree, and
# versions/<new> finished by hand). Expected: four PASS lines and exit 0. Undo: gio trash <workspace>.
set -uo pipefail
repo=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
prev=${1:-1.141.2} next=${2:-1.142.0}
original=$repo/versions/$next
ws=$(realpath -m "${3:-$repo/versions/$next-replay}")
if [[ ! -d $ws ]]; then
  bash "$repo/scripts/update/update.sh" "$prev" "$next" --workspace "$ws" --sources-from "$original" --offline || exit 1
fi
fail=0
check() { if "${@:2}"; then printf 'PASS %s\n' "$1"; else printf 'FAIL %s\n' "$1"; fail=1; fi; }
check "port report clean" grep -q ': clean$' <(head -n 1 "$ws/evidence/port/report.md")
check "zzzz-port-$next.patch byte-identical to the original" \
  cmp "$original/patches/rebased/user/zzzz-port-$next.patch" "$ws/patches/rebased/user/zzzz-port-$next.patch"
relative() { awk '{ sub(/.*\/patches\/rebased\//, "", $2); print $1, $2 }' "$1"; }
check "all rebased patch hashes identical" diff <(relative "$original/evidence/port-patches.sha256") <(relative "$ws/evidence/port-patches.sha256")
# The original porting tree: ORIGINAL_TREE, else the last port run before the patch probe and build trees.
original_tree=${ORIGINAL_TREE:-$(find "$original/work" -maxdepth 1 -name '20*Z' -type d | sort | while read -r d; do
  [[ -e $d/VSCode-linux-x64 ]] && break; printf '%s\n' "$d"; done | tail -n 2 | head -n 1)/vscode}
replay_tree=$(sed -n 's/^Tree: //p' "$ws/evidence/port/report.md")
printf 'Trees: %s vs %s\n' "$original_tree" "$replay_tree"
check "porting tree identical (diff -rq, excluding .git and dependencies)" \
  diff -rq --no-dereference -x .git -x node_modules -x .build "$original_tree" "$replay_tree"
exit "$fail"
