#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
for evidence in "$project"/evidence/gui-*; do
  test -d "$evidence" || continue
  testdir=$(cat "$evidence/profile-path.txt")
  for proc in /proc/[0-9]*; do
    if rg -a -q -F -- "$testdir/profile" "$proc/cmdline" 2>/dev/null; then
      printf 'FAIL: test profile still has a process, PID=%s\n' "${proc##*/}"
      exit 1
    fi
  done
  if [[ -f "$evidence/test-mounts.txt" ]]; then
    while IFS= read -r mount; do
      if mountpoint -q "$mount"; then
        printf 'FAIL: test mount remains: %s\n' "$mount"
        exit 1
      fi
    done < "$evidence/test-mounts.txt"
  fi
done
printf 'PASS: all recorded test profiles have no remaining processes or mounts.\n'
