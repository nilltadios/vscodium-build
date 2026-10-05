#!/usr/bin/env bash
# Opens only an isolated, temporary test instance for 35 seconds.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
monitor=${1:?Provide the monitor from kscreen-doctor -o}
appimage=$(cat "$project/evidence/latest-appimage.txt")
stamp=$(date -u +%Y%m%dT%H%M%S%NZ)
testdir="$project/work/gui-$stamp"
helpers=/home/nilllinux22/.codex/skills/kde-desktop-app-testing/scripts
mkdir -p "$testdir" "$project/evidence/gui-$stamp"
evidence="$project/evidence/gui-$stamp"
kscreen-doctor -j > "$evidence/monitors.json"
printf '%s\n' "$testdir" > "$evidence/profile-path.txt"
printf '%s\n' "$appimage" > "$evidence/appimage-path.txt"
sha256sum "$appimage" > "$evidence/appimage.sha256"
printf 'Opening isolated VSCodium on %s for 35 seconds.\n' "$monitor"
timeout --signal=TERM --kill-after=5s 35s \
  bash "$helpers/on-screen.sh" "$monitor" codium -- \
  env XDG_DATA_HOME="$testdir/data" XDG_CACHE_HOME="$testdir/cache" \
  XDG_STATE_HOME="$testdir/state" VSCODE_APPSTATE="$testdir/state" \
  "$appimage" --new-window \
  --user-data-dir "$testdir/profile" --extensions-dir "$testdir/extensions" \
  --shared-data-dir "$testdir/shared" --agent-plugins-dir "$testdir/agent-plugins" \
  --agents-user-data-dir "$testdir/agents" --agents-extensions-dir "$testdir/agent-extensions" \
  --disable-extensions --password-store=basic --skip-welcome --skip-release-notes \
  "$project/README.md" > "$evidence/launch.log" 2>&1 &
test_pid=$!
sleep 15
bash "$project/scripts/check-gui-runtime.sh" "$testdir/profile" > "$evidence/runtime.txt"
bash "$helpers/capture-screen.sh" "$monitor" "$evidence/screen.png"
set +e
wait "$test_pid"
status=$?
set -e
printf '%s\n' "$status" > "$evidence/launch-exit.txt"
[[ "$status" == 124 || "$status" == 0 ]]
printf '%s\n' "$evidence" > "$project/evidence/latest-gui.txt"
printf 'Capture saved: %s/screen.png\nInspect the image and profile logs before claiming a GUI pass.\n' "$evidence"
