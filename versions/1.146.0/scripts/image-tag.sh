#!/usr/bin/env bash
# Print the builder image tag for a VS Code tree: localhost/vscodium-build:node-<.nvmrc>, plus -pnpm-<version>
# when package.json pins pnpm (VS Code 1.146+). Fails when the workspace Containerfile pins a different pnpm
# than package.json, so an upstream pnpm bump cannot silently reuse an image with the old one.
# Usage: image-tag.sh [vscode-dir]   (default: <workspace>/sources/vscode)
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
tree=${1:-$project/sources/vscode}
tag=node-$(tr -d '\n' < "$tree/.nvmrc")
pnpm=$(jq -r '.packageManager // ""' "$tree/package.json" | sed -nE 's/^pnpm@([0-9]+\.[0-9]+\.[0-9]+).*/\1/p')
if [[ -n $pnpm ]]; then
  pinned=$(sed -nE 's/^ARG PNPM_VERSION=([0-9.]+)$/\1/p' "$project/Containerfile")
  if [[ $pinned != "$pnpm" ]]; then
    printf 'image-tag: package.json pins pnpm %s but Containerfile has PNPM_VERSION=%s; update PNPM_VERSION and PNPM_SHA256.\n' \
      "$pnpm" "${pinned:-<none>}" >&2
    exit 3
  fi
  tag+=-pnpm-$pnpm
fi
printf 'localhost/vscodium-build:%s\n' "$tag"
