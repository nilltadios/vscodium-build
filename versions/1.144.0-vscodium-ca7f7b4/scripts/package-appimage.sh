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
# Optional embedded update information, e.g.
# APPIMAGE_UPDATE_INFO='gh-releases-zsync|owner|repo|latest|VSCodium-local-*-x86_64.AppImage.zsync'
# makes the AppImage updatable (AppImageUpdate, Gear Lever) and writes "$output.zsync".
update_args=()
if [[ -n ${APPIMAGE_UPDATE_INFO:-} ]]; then
  update_args=(-u "$APPIMAGE_UPDATE_INFO")
  rm -f "$output.zsync"
fi
# Absolute paths: extract-and-run does not resolve relative paths against this directory.
ARCH=x86_64 APPIMAGE_EXTRACT_AND_RUN=1 "$project/cache/tools/appimagetool-x86_64.AppImage" \
  --no-appstream --runtime-file "$project/cache/tools/runtime-x86_64" "${update_args[@]}" \
  --mksquashfs-opt -processors --mksquashfs-opt 4 "$appdir" "$output"
chmod u+x "$output"
if [[ -n ${APPIMAGE_UPDATE_INFO:-} && ! -s "$output.zsync" ]]; then
  # appimagetool 8c8c91f logs a zsync step but writes no file; use zsyncmake from PATH or
  # the copy bundled inside the pinned, digest-checked appimagetool.
  zsyncmake=$(command -v zsyncmake || true)
  if [[ -z $zsyncmake ]]; then
    tooldir=$(mktemp -d)
    (cd "$tooldir" && "$project/cache/tools/appimagetool-x86_64.AppImage" --appimage-extract usr/bin/zsyncmake >/dev/null)
    zsyncmake="$tooldir/squashfs-root/usr/bin/zsyncmake"
  fi
  (cd "$(dirname "$output")" && "$zsyncmake" -u "$(basename "$output")" -o "$output.zsync" "$output")
  rm -rf "${tooldir:-}"
fi
sha256sum "$output" > "$output.sha256"
file "$output"
printf '%s\n' "$output" > evidence/latest-appimage.txt
printf '%s\n' "$appdir" > evidence/latest-appdir.txt
