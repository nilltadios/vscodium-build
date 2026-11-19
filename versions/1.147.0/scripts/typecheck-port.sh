#!/usr/bin/env bash
set -euo pipefail
target=$(realpath "$1")
dependencies=$(realpath "$2")
for directory in node_modules .build build/node_modules; do
  if [[ ! -e "$target/$directory" && ! -L "$target/$directory" ]]; then
    ln -s "$(realpath --relative-to="$(dirname "$target/$directory")" "$dependencies/$directory")" "$target/$directory"
  fi
done
cd "$target"
exec node node_modules/@typescript/native/bin/tsc --project src/tsconfig.json --noEmit --pretty false
