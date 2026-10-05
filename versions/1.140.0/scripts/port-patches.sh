#!/usr/bin/env bash
# Apply individual hunks to a disposable source copy for manual porting.
set -eo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=$(cat "$project/work/latest-path.txt")
cd "$target"
export VSCODE_QUALITY=stable OS_NAME=linux VSCODE_ARCH=x64 DISABLE_UPDATE=yes
export RELEASE_VERSION=$(jq -r .release_version "$project/config.json")
source ./utils.sh
mkdir -p "$project/patches/rebased" "$project/evidence/rejects"
apply_patch() {
  local patch_path=$1 name
  name=${patch_path#../patches/}
  git add -A -- . ':!*.rej' ':!*.orig'
  baseline=$(git write-tree)
  cp "$patch_path" "$patch_path.original"
  for key in APP_NAME APP_NAME_LC ASSETS_REPOSITORY BINARY_NAME GH_REPO_PATH GLOBAL_DIRNAME ORG_NAME RELEASE_VERSION TUNNEL_APP_NAME; do
    replace "s|!!$key!!|${!key}|g" "$patch_path"
  done
  git apply --reject --ignore-whitespace "$patch_path" || true
  git add -N -- . ':!*.rej' ':!*.orig'
  mkdir -p "$project/patches/rebased/$(dirname "$name")"
  # add -N stages removals; compare the full index/worktree to the prepatch tree.
  git diff --binary "$baseline" > "$project/patches/rebased/$name"
  # Retain rejects with their originating patch name for review.
  while IFS= read -r -d '' reject; do
    dest="$project/evidence/rejects/$name/$reject"
    mkdir -p "$(dirname "$dest")"
    mv "$reject" "$dest"
  done < <(find . -name '*.rej' -print0)
  mv "$patch_path.original" "$patch_path"
}
source <(sed '/^# {{{ install dependencies/,$d; /^\. ..\/utils.sh$/d; s/set -x/set +x/g' prepare_vscode.sh)
set +x
git add -A
printf '\nPorting tree: %s/vscode\n' "$target"
