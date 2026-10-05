#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
appimage=$(realpath "${1:?Provide the AppImage}")
sha256sum -c "$appimage.sha256"
version=$("$appimage" --version)
printf '%s\n' "$version"
expected=$(jq -r .release_version "$project/config.json")
[[ "$(head -n 1 <<< "$version")" == "$expected" ]]
[[ "$(tail -n 1 <<< "$version")" == x64 ]]
printf 'PASS: AppImage mounts and its CLI reports the expected version and architecture.\n'
