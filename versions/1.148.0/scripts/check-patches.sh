#!/usr/bin/env bash
# Probe the upstream preparation sequence, collecting every failed patch.
set -eo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=$(cat "$project/work/latest-path.txt")
cd "$target"
export VSCODE_QUALITY=stable OS_NAME=linux VSCODE_ARCH=x64
export DISABLE_UPDATE=yes
export RELEASE_VERSION=$(jq -r .release_version "$project/config.json")
source ./utils.sh
failed=0
applied=0
report="$project/evidence/patches-$(basename "$target").tsv"
printf 'patch\tresult\n' > "$report"
eval "$(declare -f apply_patch | sed '1s/apply_patch/upstream_apply_patch/')"
apply_patch() {
  local name
  name=$(basename "$1")
  if (set -e; upstream_apply_patch "$1" ""); then
    printf '%s\tPASS\n' "$name" >> "$report"
    applied=$((applied+1))
  else
    printf '%s\tFAIL\n' "$name" >> "$report"
    failed=$((failed+1))
  fi
}
# Execute only branding and patch application, before dependency installation.
source <(sed '/^# {{{ install dependencies/,$d; /^\. ..\/utils.sh$/d; s/set -x/set +x/g' prepare_vscode.sh)
set +x
printf '\nPatch probe: %s applied; %s failed. Report: %s\n' "$applied" "$failed" "$report"
test "$failed" -eq 0
