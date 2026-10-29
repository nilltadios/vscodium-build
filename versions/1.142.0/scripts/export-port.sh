#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=${1:?Provide the porting work directory}
mkdir -p "$project/patches/rebased/user"
git -C "$target/vscode" diff --binary > "$project/patches/rebased/user/99-port-1.139.1.patch"
test -s "$project/patches/rebased/user/99-port-1.139.1.patch"
find "$project/patches/rebased" -type f -print0 | sort -z | xargs -0 sha256sum > "$project/evidence/port-patches.sha256"
