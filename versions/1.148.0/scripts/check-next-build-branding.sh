#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT
bash "$project/scripts/apply-branding.sh" "$scratch/work"
for tree in "$scratch/work/src/stable" "$scratch/work/vscode"; do
  cmp "$project/assets/branding/logo.png" "$tree/resources/linux/code.png"
  cmp "$project/assets/branding/logo.svg" "$tree/src/vs/workbench/browser/media/code-icon.svg"
done
cmp "$project/assets/branding/local-theme-defaults/package.json" "$scratch/work/vscode/extensions/local-theme-defaults/package.json"
jq -e '.contributes.configurationDefaults["workbench.colorTheme"] == "Dark Modern" and .contributes.configurationDefaults["workbench.colorCustomizations"].focusBorder == "#FF0000"' "$scratch/work/vscode/extensions/local-theme-defaults/package.json"
version=$(jq -r .release_version "$project/config.json")
bash "$project/scripts/stage-appimage-branding.sh" "$scratch/AppDir" "$version"
if bash "$project/scripts/stage-appimage-branding.sh" "$scratch/invalid" '0.0.0' 2>/dev/null; then
  printf 'FAIL: wrong build version accepted\n' >&2
  exit 1
fi
bash "$project/scripts/render-logo.sh" "$scratch/logo.png"
pixel_difference=$(magick compare -metric AE "$project/assets/branding/logo.png" "$scratch/logo.png" null: 2>&1)
[[ "$pixel_difference" == 0 || "$pixel_difference" == '0 (0)' ]]
rg -q 'bash "\$project/scripts/apply-branding.sh" "\$target"' "$project/scripts/prepare-work.sh"
rg -q 'bash scripts/stage-appimage-branding.sh "\$appdir" "\$version"' "$project/scripts/package-appimage.sh"
printf 'PASS: custom artwork in both build trees; default theme extension; AppImage icon, desktop metadata and version %s; wrong version rejected; rendered PNG pixels reproduced exactly. No editor build run.\n' "$version"
