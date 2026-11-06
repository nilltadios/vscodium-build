#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
stamp=$(date -u +%Y%m%dT%H%M%S%NZ)
exec > >(tee "evidence/verification-$stamp.txt") 2>&1
for script in scripts/*.sh; do bash -n "$script"; done
jq -e '.vscode_commit | test("^[a-f0-9]{40}$")' sources.lock.json
for name in vscodium vscode; do
  test -z "$(git -C "sources/$name" status --porcelain)"
  test "$(git -C "sources/$name" rev-parse HEAD)" = "$(jq -r ".${name}_commit" sources.lock.json)"
done
if [[ ${HOST_GUARDS:-1} == 1 ]]; then
  sha256sum -c evidence/installed-app-*.sha256
  find /home/nilllinux22 -mindepth 1 -maxdepth 1 -printf '%f\n' | sort > "evidence/home-after-$stamp.txt"
  first=$(find evidence -maxdepth 1 -name 'home-before-*.txt' | sort | head -n 1)
  diff -u "$first" "evidence/home-after-$stamp.txt"
  printf 'PASS: scripts parse; source checkouts are clean and pinned; installed editor and home-root entries are unchanged.\n'
else
  printf 'PASS: scripts parse; source checkouts are clean and pinned (HOST_GUARDS=0: home-root and installed-editor checks skipped).\n'
fi
printf 'This verifies the project, not a successful editor build.\n'
