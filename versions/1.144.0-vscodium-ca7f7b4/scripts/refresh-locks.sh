#!/usr/bin/env bash
set -euo pipefail
target=$1
for directory in . build remote; do
  (
    cd "$target/$directory"
    npm install --package-lock-only --ignore-scripts --no-audit --no-fund
  )
done
