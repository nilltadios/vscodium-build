#!/usr/bin/env bash
# Install the porting tree's root npm dependencies (no install scripts) in the builder container, so the quick
# porting typecheck sees the new release's packages instead of the previous version's node_modules.
# The install is cached by lockfile hash in cache/port-deps/<hash>, so reruns of port.sh reuse it.
# Usage: port-deps.sh <porting-vscode-dir>   Prints the dependency directory on the last line.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
tree=$(realpath "${1:?Provide the porting vscode directory}")
node_version=$(tr -d '\n' < "$tree/.nvmrc")
key=$(cat "$tree/package.json" "$tree/package-lock.json" "$tree/.npmrc" <(printf '%s' "$node_version") | sha256sum | cut -c1-16)
deps="$project/cache/port-deps/$key"
if [[ ! -f $deps/.complete ]]; then
  rm -rf "$deps"; mkdir -p "$deps"
  cp "$tree/package.json" "$tree/package-lock.json" "$tree/.npmrc" "$deps/"
  podman run --rm --userns=keep-id --cpus=4 --memory=8g --memory-swap=12g \
    --security-opt=no-new-privileges --cap-drop=all \
    -v "$project:/project:z" -e HOME=/project/cache/home -w "/project/${deps#"$project/"}" \
    "localhost/vscodium-build:node-$node_version" \
    npm ci --ignore-scripts --no-audit --no-fund >&2
  touch "$deps/.complete"
fi
printf '%s\n' "$deps"
