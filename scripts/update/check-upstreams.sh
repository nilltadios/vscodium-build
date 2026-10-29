#!/usr/bin/env bash
# Run first when a new build is requested: reports both upstreams against the newest local build.
#   - VS Code: newest stable x.y.z release tag on microsoft/vscode.
#   - VSCodium: master on VSCodium/vscodium versus the pinned vscodium_commit, with the commits in between.
# Usage: bash scripts/update/check-upstreams.sh
# Exit: 0 both up to date; 10 a newer VS Code release; 11 VSCodium master moved; 12 both. Only reads the network
# and fetches into the newest workspace's sources/vscodium clone (FETCH_HEAD); nothing else changes.
set -euo pipefail
repo=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
latest_ws=$(find "$repo/versions" -mindepth 2 -maxdepth 2 -name config.json -printf '%h\n' | sort -V | tail -n 1)
built=$(jq -r .vscode_version "$latest_ws/config.json")
pin=$(jq -r .vscodium_commit "$latest_ws/config.json")

vscode=$(timeout 30 git ls-remote --tags --refs https://github.com/microsoft/vscode.git 'refs/tags/1.*' |
  sed 's|.*refs/tags/||' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1)
master=$(timeout 30 git ls-remote https://github.com/VSCodium/vscodium.git refs/heads/master | cut -f1)
[[ -n $vscode && -n $master ]] || { printf 'Could not reach GitHub.\n' >&2; exit 2; }

status=0
printf 'Newest local workspace: %s (VS Code %s, VSCodium %s)\n' "${latest_ws#"$repo/"}" "$built" "${pin:0:7}"
if [[ $(printf '%s\n%s\n' "$built" "$vscode" | sort -V | tail -n 1) != "$built" ]]; then
  printf 'VS Code: %s released (local %s).\n' "$vscode" "$built"; status=10
else
  printf 'VS Code: %s, up to date.\n' "$vscode"
fi
if [[ $master != "$pin" ]]; then
  printf 'VSCodium: master %s, pinned %s. Commits not in the pin:\n' "${master:0:7}" "${pin:0:7}"
  clone=$latest_ws/sources/vscodium
  if timeout 60 git -C "$clone" fetch -q origin master 2>/dev/null; then
    git -C "$clone" log --format='  %h %ad %s' --date=short "$pin..FETCH_HEAD"
    printf '  targets VS Code %s\n' "$(git -C "$clone" show FETCH_HEAD:upstream/stable.json | jq -r .tag)"
  fi
  printf 'Port onto it: bash scripts/update/update.sh <prev> <new> --vscodium-commit %s\n' "$master"
  status=$((status ? 12 : 11))
else
  printf 'VSCodium: master equals the pin, up to date.\n'
fi
exit $status
