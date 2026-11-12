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
# VS Code 1.146+ has no .npmrc: keep VSCodium's 20-keymap .npmrc setting (prebuilt, checksummed native-keymap
# binary) as the environment variable its install.js reads.
[[ -f vscode/.npmrc ]] || export npm_config_build_from_source_native_keymap=no
export PATH="/usr/lib/ccache:$PATH"
printf 'Node: %s\nNpm: %s\nPnpm: %s\n' "$(node --version)" "$(npm --version)" "$(pnpm --version 2>/dev/null || echo none)"
exec bash ./build.sh
