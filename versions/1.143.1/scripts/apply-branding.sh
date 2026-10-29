#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=${1:?Provide the work directory}
# Apply only to disposable build copies. Keep pinned sources pristine.
for tree in "$target/src/stable" "$target/vscode"; do
  mkdir -p "$tree/resources/linux" "$tree/src/vs/workbench/browser/media"
  cp "$project/assets/branding/logo.png" "$tree/resources/linux/code.png"
  cp "$project/assets/branding/logo.svg" "$tree/src/vs/workbench/browser/media/code-icon.svg"
done
mkdir -p "$target/vscode/extensions/local-theme-defaults"
cp "$project/assets/branding/local-theme-defaults/package.json" "$target/vscode/extensions/local-theme-defaults/package.json"
