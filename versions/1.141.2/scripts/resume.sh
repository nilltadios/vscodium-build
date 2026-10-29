#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=${1:?Provide an existing work directory}
phase=${2:-compile}
target=$(realpath "$target")
[[ "$target" == "$project/work/"* && -d "$target/vscode" ]]
container_target="/project/${target#"$project/"}"
cd "$project"
bash scripts/timed.sh "resume-$phase" podman run --rm --name "vscodium-resume-$(date +%s)" \
  --userns=keep-id --cpus=4 --memory=8g --memory-swap=12g \
  --security-opt=no-new-privileges --cap-drop=all \
  -v "$project:/project:z" -e HOME=/project/cache/home \
  localhost/vscodium-build:node-24.18.0 \
  bash /project/scripts/resume-container.sh "$container_target" "$phase"
