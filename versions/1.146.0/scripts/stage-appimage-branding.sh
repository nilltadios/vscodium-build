#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
appdir=${1:?Provide the AppDir}
version=${2:?Provide the packaged application version}
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
[[ "$version" == "$(jq -r .release_version "$project/config.json")" ]]
mkdir -p "$appdir"
sed "s/@VERSION@/$version/g" "$project/scripts/vscodium-local.desktop" > "$appdir/vscodium-local.desktop"
cp "$project/assets/branding/logo.png" "$appdir/vscodium.png"
ln -sfn vscodium.png "$appdir/.DirIcon"
cmp "$project/assets/branding/logo.png" "$appdir/vscodium.png"
[[ "$(readlink "$appdir/.DirIcon")" == vscodium.png ]]
rg -qx "X-AppImage-Version=$version" "$appdir/vscodium-local.desktop"
rg -qx 'Comment=Code editor' "$appdir/vscodium-local.desktop"
if command -v desktop-file-validate >/dev/null; then
  desktop-file-validate "$appdir/vscodium-local.desktop"
fi
