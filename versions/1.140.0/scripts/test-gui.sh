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
cleanup() {
  # Close only the mounted main process carrying this test's exact profile.
  for proc in /proc/[0-9]*; do
    if ! rg -a -q -F -- "$testdir/profile" "$proc/cmdline" 2>/dev/null; then continue; fi
    exe=$(readlink "$proc/exe" 2>/dev/null) || continue
    [[ "$exe" == /tmp/.mount_*/usr/share/codium/codium ]] || continue
    # The CLI uses the same Electron executable. Let it wait for the editor
    # child and exit normally so AppRun keeps the FUSE mount until then.
    if rg -a -q -F -- '/resources/app/out/cli.js' "$proc/cmdline"; then continue; fi
    if ! rg -a -q -- '--type=' "$proc/cmdline"; then
      printf '%s\n' "${exe%%/usr/share/codium/codium}" >> "$evidence/test-mounts.txt"
      printf 'Closing isolated test main PID=%s\n' "${proc##*/}" >> "$evidence/cleanup.txt"
      kill -TERM "${proc##*/}" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT
kscreen-doctor -j > "$evidence/monitors.json"
printf '%s\n' "$testdir" > "$evidence/profile-path.txt"
printf '%s\n' "$appimage" > "$evidence/appimage-path.txt"
sha256sum "$appimage" > "$evidence/appimage.sha256"
printf 'Opening isolated VSCodium on %s for 35 seconds.\n' "$monitor"
test_start=$SECONDS
timeout --signal=TERM --kill-after=5s 45s \
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
delay=$((35 - (SECONDS - test_start)))
if [[ "$delay" -gt 0 ]]; then sleep "$delay"; fi
cleanup
set +e
wait "$test_pid"
status=$?
set -e
printf '%s\n' "$status" > "$evidence/launch-exit.txt"
[[ "$status" == 124 || "$status" == 0 ]]
sleep 2
remaining=0
for proc in /proc/[0-9]*; do
  if rg -a -q -F -- "$testdir/profile" "$proc/cmdline" 2>/dev/null; then
    remaining=$((remaining + 1))
  fi
done
printf 'Remaining isolated profile processes: %s\n' "$remaining" >> "$evidence/cleanup.txt"
[[ "$remaining" == 0 ]]
if [[ -f "$evidence/test-mounts.txt" ]]; then
  while IFS= read -r mount; do
    if mountpoint -q "$mount"; then
      printf 'FAIL: test mount remains: %s\n' "$mount" >> "$evidence/cleanup.txt"
      exit 1
    fi
  done < "$evidence/test-mounts.txt"
  printf 'PASS: isolated test mounts removed.\n' >> "$evidence/cleanup.txt"
fi
printf '%s\n' "$evidence" > "$project/evidence/latest-gui.txt"
printf 'Capture saved: %s/screen.png\nInspect the image and profile logs before claiming a GUI pass.\n' "$evidence"
