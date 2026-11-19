#!/usr/bin/env bash
# Install the porting tree's root dependencies (no install scripts) in the builder container, so the quick
# porting typecheck sees the new release's packages instead of the previous version's node_modules.
# The install is cached by input hash in cache/port-deps/<hash>, so reruns of port.sh reuse it.
# VS Code 1.146+ (pnpm-lock.yaml): pnpm install --frozen-lockfile of the root workspace project only; older
# trees: npm ci. Usage: port-deps.sh <porting-vscode-dir>   Prints the dependency directory on the last line.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
tree=$(realpath "${1:?Provide the porting vscode directory}")
image=$(bash "$project/scripts/image-tag.sh" "$tree")
if [[ -f $tree/pnpm-lock.yaml ]]; then
  # The frozen install checks every workspace importer and the pnpmfile checksum, so copy those inputs.
  members=$(sed -nE 's/^  - (.+)$/\1/p' <(sed -n '/^packages:/,/^[a-z]/p' "$tree/pnpm-workspace.yaml"))
  inputs=(package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.mjs build/npm/pnpm/nativeBuildEnv.ts)
  for member in $members; do inputs+=("$member/package.json"); done
  # patchedDependencies: pnpm applies these patch files during the install.
  while IFS= read -r patch; do inputs+=("$patch"); done < <(sed -n '/^patchedDependencies:/,/^[a-zA-Z]/{s/^  [^:]*: *//p}' "$tree/pnpm-workspace.yaml")
  install=(pnpm install --frozen-lockfile --ignore-scripts --filter .)
else
  inputs=(package.json package-lock.json .npmrc)
  install=(npm ci --ignore-scripts --no-audit --no-fund)
fi
key=$( (cd "$tree" && cat "${inputs[@]}"; printf '%s' "$image") | sha256sum | cut -c1-16)
deps="$project/cache/port-deps/$key"
if [[ ! -f $deps/.complete ]]; then
  rm -rf "$deps"; mkdir -p "$deps"
  (cd "$tree" && cp --parents "${inputs[@]}" "$deps/")
  podman run --rm --userns=keep-id --cpus=4 --memory=8g --memory-swap=12g \
    --security-opt=no-new-privileges --cap-drop=all \
    -v "$project:/project:z" -e HOME=/project/cache/home -w "/project/${deps#"$project/"}" \
    "$image" "${install[@]}" >&2
  touch "$deps/.complete"
fi
printf '%s\n' "$deps"
