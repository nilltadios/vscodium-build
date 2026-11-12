#!/usr/bin/env bash
# Re-resolve the lockfiles after the patches changed package.json files (removed agent SDKs, @vscodium forks).
# VS Code 1.146+ uses pnpm: the root workspace and each separate install root that has a lockfile.
set -euo pipefail
target=$1
if [[ -f $target/pnpm-lock.yaml ]]; then
  for directory in . build remote extensions extensions/copilot; do
    [[ -f $target/$directory/pnpm-lock.yaml && -f $target/$directory/package.json ]] || continue
    printf '== pnpm lockfile: %s\n' "$directory"
    (cd "$target/$directory" && pnpm install --lockfile-only --ignore-scripts)
  done
else
  for directory in . build remote; do
    (cd "$target/$directory" && npm install --package-lock-only --ignore-scripts --no-audit --no-fund)
  done
fi
