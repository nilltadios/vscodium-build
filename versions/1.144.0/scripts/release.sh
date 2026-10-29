#!/usr/bin/env bash
# One unattended release run after port.sh reports clean: build -> GUI smoke -> STATUS.md -> final checks.
# Usage: bash scripts/release.sh <monitor>     (monitor from kscreen-doctor -o, e.g. DP-1)
#        bash scripts/release.sh --finish      (after the screenshot review was recorded)
# The screenshot review cannot be automated: after the GUI smoke, look at evidence/<latest-gui>/screen.png and
# record it with node scripts/record-visual-review.mjs --passed "<observations>", then run --finish.
# Exit: 0 released and verified; 3 waiting for the visual review; anything else is the failing stage's exit.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
version=$(jq -r .vscode_version config.json)
timed() { bash scripts/timed.sh "$@"; }
finish() {
  node scripts/write-status.mjs
  timed final-verification node scripts/verify-final.mjs
  timed all-test-cleanup bash scripts/check-test-cleanup.sh
  node scripts/write-status.mjs  # again, so STATUS.md lists the two checks above
  printf 'Released and verified: %s\n' "$(cat evidence/latest-appimage.txt)"
}
if [[ ${1:-} == --finish ]]; then finish; exit 0; fi
monitor=${1:?Usage: release.sh <monitor> | --finish}
[[ -f evidence/port/report.md ]] && ! head -n 1 evidence/port/report.md | grep -q ': clean$' && {
  printf 'evidence/port/report.md is not clean; finish the port first (bash scripts/port.sh).\n' >&2; exit 2; }
timed "full-build-$version" bash scripts/build.sh
timed gui-smoke bash scripts/test-gui.sh "$monitor"
gui=$(cat evidence/latest-gui.txt)
if [[ -f $gui/visual-review.json ]]; then finish; exit 0; fi
printf 'Build and GUI smoke passed. Review %s/screen.png, then:\n' "$gui"
printf '  node scripts/record-visual-review.mjs --passed "<what the screenshot shows>" && bash scripts/release.sh --finish\n'
exit 3
