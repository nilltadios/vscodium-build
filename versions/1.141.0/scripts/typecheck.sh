#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=$(realpath "${1:?Provide the installed work directory}")
container_target="/project/${target#"$project/"}/vscode"
cd "$project"
bash scripts/timed.sh typecheck podman run --rm --userns=keep-id \
  --cpus=4 --memory=8g --memory-swap=12g --security-opt=no-new-privileges --cap-drop=all \
  -v "$project:/project:z" -w "$container_target" \
  -e HOME=/project/cache/home -e GOMEMLIMIT=6GiB -e GOMAXPROCS=4 \
  localhost/vscodium-build:node-24.18.0 \
  node node_modules/@typescript/native/bin/tsc --project src/tsconfig.json --noEmit --pretty false
