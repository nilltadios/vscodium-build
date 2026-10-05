#!/usr/bin/env bash
set -eo pipefail
project=/project
target=$1
cd "$target"
bash /project/scripts/apply-branding.sh "$target"
export VSCODE_QUALITY=stable OS_NAME=linux VSCODE_ARCH=x64
export CI_BUILD=no SHOULD_BUILD=yes DISABLE_UPDATE=yes
export SHOULD_BUILD_REH=no SHOULD_BUILD_REH_WEB=no SHOULD_BUILD_CLI=no
export RELEASE_VERSION=$(jq -r .release_version "$project/config.json")
export MS_TAG=$(jq -r .vscode_version "$project/sources.lock.json")
export MS_COMMIT=$(jq -r .vscode_commit "$project/sources.lock.json")
export MAX_OLD_SPACE_SIZE=6144
export npm_config_arch=x64
export PATH="/usr/lib/ccache:$PATH"
printf 'Node: %s\nNpm: %s\n' "$(node --version)" "$(npm --version)"
exec bash ./build.sh
