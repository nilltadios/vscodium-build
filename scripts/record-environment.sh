#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
printf '\nUTC time\n'
date -u --iso-8601=seconds
printf '\nHost OS\n'
cat /etc/os-release
printf '\nCPU\n'
lscpu
printf '\nMemory\n'
free -h
printf '\nFilesystem\n'
df -h "$project"
printf '\nHost tools\n'
node --version
npm --version
podman --version
printf '\nContainer toolchain\n'
podman run --rm --userns=keep-id \
  --security-opt=no-new-privileges --cap-drop=all \
  localhost/vscodium-build:node-24.18.0 \
  bash -c 'node --version; npm --version; cc --version; ccache --version'
printf '\nBuilder image ID\n'
podman image inspect localhost/vscodium-build:node-24.18.0 --format '{{.Id}}'
