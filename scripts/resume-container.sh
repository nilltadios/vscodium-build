#!/usr/bin/env bash
# Resume a known prepared work copy without applying the patch set twice.
set -eo pipefail
target=$1
phase=${2:-compile}
cd "$target"
bash /project/scripts/apply-branding.sh "$target"
export VSCODE_QUALITY=stable OS_NAME=linux VSCODE_ARCH=x64
export CI_BUILD=no SHOULD_BUILD=yes DISABLE_UPDATE=yes
export SHOULD_BUILD_REH=no SHOULD_BUILD_REH_WEB=no SHOULD_BUILD_CLI=no
export RELEASE_VERSION=$(jq -r .release_version /project/config.json)
export MS_TAG=$(jq -r .vscode_version /project/sources.lock.json)
export MS_COMMIT=$(jq -r .vscode_commit /project/sources.lock.json)
export MAX_OLD_SPACE_SIZE=6144 npm_config_arch=x64
export PATH="/usr/lib/ccache:$PATH"
export ELECTRON_SKIP_BINARY_DOWNLOAD=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export npm_config_cache=/project/cache/npm
source ./utils.sh
if [[ "$phase" == install || "$phase" == postinstall ]]; then
  source <(sed -n '/^setpath() {/,/^setpath "product"/p' prepare_vscode.sh | sed '$d')
  cd vscode
  if [[ "$phase" == postinstall ]]; then
    node build/npm/postinstall.ts
    mv .npmrc.bak .npmrc
    source <(sed -n '/^# package.json/,$p' ../prepare_vscode.sh)
  else
    if [[ -f .npmrc.bak ]]; then cp .npmrc.bak .npmrc; fi
    source <(sed -n '/^# {{{ install dependencies/,$p' ../prepare_vscode.sh)
  fi
  cd "$target"
  touch .prepared
elif [[ "$phase" != compile ]]; then
  echo 'Phase must be install, postinstall, or compile' >&2
  exit 2
fi
exec bash <(sed '/^  \. prepare_vscode.sh$/d' build.sh)
