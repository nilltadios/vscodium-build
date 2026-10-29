#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=$(realpath "${1:?Provide the completed work directory}")
source="$target/VSCode-linux-x64"
[[ -x "$source/codium" && -f "$source/resources/app/product.json" ]]
version=$(jq -r .version "$source/resources/app/package.json")
[[ "$version" == "$(jq -r .release_version "$project/config.json")" ]]
cd "$project"
bash scripts/fetch-appimagetool.sh
bash scripts/fetch-runtime.sh
stage="$project/work/appimage-$(date -u +%Y%m%dT%H%M%S%NZ)"
appdir="$stage/AppDir"
mkdir -p "$appdir/usr/share/codium" dist
cp -a --reflink=auto "$source/." "$appdir/usr/share/codium/"
cp scripts/AppRun "$appdir/AppRun"
chmod u+x "$appdir/AppRun"
bash scripts/stage-appimage-branding.sh "$appdir" "$version"
output="$project/dist/VSCodium-local-$version-x86_64.AppImage"
if [[ -e "$output" ]]; then
  mv "$output" "$output.bak-$(date -u +%Y%m%dT%H%M%S%NZ)"
fi
# Absolute paths: extract-and-run does not resolve relative paths against this directory.
ARCH=x86_64 APPIMAGE_EXTRACT_AND_RUN=1 "$project/cache/tools/appimagetool-x86_64.AppImage" \
  --no-appstream --runtime-file "$project/cache/tools/runtime-x86_64" \
  --mksquashfs-opt -processors --mksquashfs-opt 4 "$appdir" "$output"
chmod u+x "$output"
sha256sum "$output" > "$output.sha256"
file "$output"
printf '%s\n' "$output" > evidence/latest-appimage.txt
printf '%s\n' "$appdir" > evidence/latest-appdir.txt
