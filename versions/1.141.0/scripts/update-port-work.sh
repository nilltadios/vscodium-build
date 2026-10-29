#!/usr/bin/env bash
# Refresh only source fixes in an idle development build, preserving installed dependencies.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=$(realpath "${1:?Provide the idle build directory}")
old="$target/patches/user/99-port-1.139.1.patch"
new="$project/patches/rebased/user/99-port-1.139.1.patch"
cd "$target/vscode"
git apply --reverse --check --include='src/**' "$old"
git apply --reverse --include='src/**' "$old"
if git apply --check --include='src/**' "$new"; then
  git apply --include='src/**' "$new"
  cp "$old" "$old.bak-$(date -u +%Y%m%dT%H%M%S%NZ)"
  cp "$new" "$old"
else
  git apply --include='src/**' "$old"
  exit 1
fi
