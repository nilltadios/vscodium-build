#!/usr/bin/env bash
# Recreate a finished workspace's patched tree (work/<stamp>, work/latest-path.txt) after its work/ was deleted,
# so update.sh can port from it again.
# Usage: bash scripts/update/restore-tree.sh versions/<v>
# VS Code 1.146+ (nativeBuild.target in package.json). Needs the workspace's sources/ and patches/rebased/ (both kept by the cleanup). Steps:
#   1. evidence/port-patches.sha256 still matches patches/rebased (the patch set the release was built from);
#   2. prepare-work.sh + check-patches.sh (the same steps port.sh runs after export; every patch must apply);
#   3. .build/typings/electron.d.ts, which port.sh's typecheck takes from the previous tree: downloaded from the
#      Electron release named in package.json and checked against build/checksums/electron.txt, as upstream's
#      build/npm/electronTypes.ts does.
# Creates only work/<stamp> (and a new evidence/patches-<stamp>.tsv). Undo: gio trash versions/<v>/work.
set -euo pipefail
ws=$(realpath "${1:?Usage: restore-tree.sh versions/<v>}")
cd "$ws"
if [[ -f evidence/port-patches.sha256 ]]; then
  sha256sum -c --quiet evidence/port-patches.sha256
  printf 'Patch hashes match evidence/port-patches.sha256.\n'
fi
bash scripts/prepare-work.sh
bash scripts/check-patches.sh
tree=$(cat work/latest-path.txt)/vscode
version=$(jq -r .nativeBuild.target "$tree/package.json")
expected=$(sed -n 's/^\([0-9a-f]\{64\}\) \*electron\.d\.ts$/\1/p' "$tree/build/checksums/electron.txt")
[[ -n $version && $version != null && -n $expected ]] || { printf 'Cannot find the Electron version or checksum.\n' >&2; exit 2; }
mkdir -p "$tree/.build/typings"
curl -fsSL --retry 3 -o "$tree/.build/typings/electron.d.ts.part" \
  "https://github.com/electron/electron/releases/download/v$version/electron.d.ts"
printf '%s  %s\n' "$expected" "$tree/.build/typings/electron.d.ts.part" | sha256sum -c --quiet
mv "$tree/.build/typings/electron.d.ts.part" "$tree/.build/typings/electron.d.ts"
printf 'Restored %s (Electron %s typings, sha256 %s).\n' "$(dirname "$tree")" "$version" "$expected"
