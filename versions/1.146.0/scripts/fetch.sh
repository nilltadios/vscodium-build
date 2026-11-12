#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
mkdir -p sources evidence cache logs dist patches
stamp=$(date -u +%Y%m%dT%H%M%SZ)
exec > >(tee "logs/fetch-$stamp.log") 2>&1
# Local-host guards (home-root inventory, installed editor unchanged). CI sets HOST_GUARDS=0.
if [[ ${HOST_GUARDS:-1} == 1 ]]; then
  find /home/nilllinux22 -mindepth 1 -maxdepth 1 -printf '%f\n' | sort > "evidence/home-before-$stamp.txt"
  installed_app=${INSTALLED_APPIMAGE:-/home/nilllinux22/AppImages/vscodium.appimage}
  installed_checksum=$(sha256sum "$installed_app")
  printf '%s\n' "$installed_checksum" > "evidence/installed-app-$stamp.sha256"
fi
version=$(jq -r .vscode_version config.json)
codium_commit=$(jq -r .vscodium_commit config.json)
if [[ ! -f sources.lock.json ]]; then
  url="https://api.github.com/repos/microsoft/vscode/commits/$version"
  printf '%s\t%s\n' "$stamp" "$url" >> evidence/fetch-sources.tsv
  curl -fLsS --retry 3 "$url" -o "evidence/vscode-$version-commit.json"
  jq --arg codium "$codium_commit" --arg version "$version" --arg date "$stamp" \
    '{vscode_version:$version,vscode_commit:.sha,vscodium_commit:$codium,resolved_at:$date}' \
    "evidence/vscode-$version-commit.json" > sources.lock.json
fi
test "$(jq -r .vscode_version sources.lock.json)" = "$version" || {
  printf 'config.json and sources.lock.json specify different VS Code versions. Resolve the new source pin before building.\n' >&2
  exit 2
}
test "$(jq -r .vscodium_commit sources.lock.json)" = "$codium_commit"
for name in vscodium vscode; do
  if [[ $name == vscodium ]]; then
    repo=https://github.com/VSCodium/vscodium.git
    commit=$(jq -r .vscodium_commit sources.lock.json)
  else
    repo=https://github.com/microsoft/vscode.git
    commit=$(jq -r .vscode_commit sources.lock.json)
  fi
  if [[ ! -d sources/$name/.git ]]; then
    git init -q "sources/$name"
    git -C "sources/$name" remote add origin "$repo"
    printf '%s\tgit fetch --depth 1 %s %s\n' "$stamp" "$repo" "$commit" >> evidence/fetch-sources.tsv
    git -C "sources/$name" fetch --depth 1 origin "$commit"
    git -C "sources/$name" checkout --detach FETCH_HEAD
  fi
  test "$(git -C "sources/$name" rev-parse HEAD)" = "$commit"
done
printf 'Pinned sources fetched successfully.\n'
