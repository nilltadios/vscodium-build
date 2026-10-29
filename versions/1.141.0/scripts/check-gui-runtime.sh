#!/usr/bin/env bash
# Check a named isolated test profile without printing other process arguments.
set -euo pipefail
profile=${1:?Provide the isolated profile path}
renderer=0
main=0
for proc in /proc/[0-9]*; do
  if ! rg -a -q -F -- "$profile" "$proc/cmdline" 2>/dev/null; then continue; fi
  exe=$(readlink "$proc/exe" 2>/dev/null) || continue
  [[ "$exe" == /tmp/.mount_*/usr/share/codium/codium ]] || continue
  [[ -r "$exe" ]] || { printf 'FAIL: editor executable no longer accessible.\n'; exit 1; }
  printf 'PID=%s executable=%s\n' "${proc##*/}" "$exe"
  if rg -a -q -- '--type=renderer' "$proc/cmdline"; then
    renderer=$((renderer + 1))
  elif ! rg -a -q -- '--type=' "$proc/cmdline"; then
    main=$((main + 1))
    findmnt -rn -T "$exe" -o SOURCE,TARGET,FSTYPE
  fi
done
[[ "$main" -ge 1 && "$renderer" -ge 1 ]] || {
  printf 'FAIL: expected a mounted main process and renderer; main=%s renderer=%s.\n' "$main" "$renderer"
  exit 1
}
printf 'PASS: mounted AppImage editor and renderer remain alive.\n'
