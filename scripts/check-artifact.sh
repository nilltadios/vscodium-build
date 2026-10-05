#!/usr/bin/env bash
set -euo pipefail
app=$(realpath "${1:?Provide VSCode-linux-x64}")
cmp "$(dirname -- "${BASH_SOURCE[0]}")/../assets/branding/local-theme-defaults/package.json" "$app/resources/app/extensions/local-theme-defaults/package.json"
file "$app/codium"
header=$(LC_ALL=C readelf -h "$app/codium")
printf '%s\n' "$header"
[[ "$header" == *'Advanced Micro Devices X86-64'* ]]
deps=$(ldd "$app/codium")
printf '%s\n' "$deps"
if [[ "$deps" == *'not found'* ]]; then exit 1; fi
node "$(dirname -- "${BASH_SOURCE[0]}")/check-privacy.mjs" "$app/resources/app"
set +e
rg --hidden --no-ignore --text --files-with-matches '[[:alnum:].-]+\.data\.microsoft\.com' "$app/resources/app"
status=$?
set -e
if [[ "$status" != 1 ]]; then
  echo "Known Microsoft telemetry endpoint scan failed (rg status $status)." >&2
  exit 1
fi
test ! -d "$app/resources/app/extensions/copilot"
printf 'PASS: x64 binary inspected; main shared libraries resolve on this host; static privacy checks pass; known telemetry endpoints absent.\n'
