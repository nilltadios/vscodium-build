#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
mkdir -p cache/tools evidence
lock=appimagetool.lock.json
if [[ ! -f "$lock" ]]; then
  url=https://api.github.com/repos/AppImage/appimagetool/releases/latest
  curl --fail --location --retry 3 "$url" -o evidence/appimagetool-release.json
  jq --arg url "$url" --arg fetched_at "$(date -u +%FT%TZ)" '
    . as $release | .assets[] | select(.name == "appimagetool-x86_64.AppImage") |
    {tag: $release.tag_name, source: $url, fetched_at: $fetched_at,
     url: .browser_download_url, digest: .digest}' evidence/appimagetool-release.json > "$lock"
  test -s "$lock"
fi
tool=cache/tools/appimagetool-x86_64.AppImage
if [[ ! -f "$tool" ]]; then
  curl --fail --location --retry 3 "$(jq -r .url "$lock")" -o "$tool.part"
  mv "$tool.part" "$tool"
fi
digest=$(jq -r '.digest // empty' "$lock")
if [[ "$digest" == sha256:* ]]; then
  printf '%s  %s\n' "${digest#sha256:}" "$tool" | sha256sum --check
else
  echo 'Release API did not provide a SHA-256 digest; refusing unverified tool.' >&2
  exit 1
fi
chmod u+x "$tool"
sha256sum "$tool" > evidence/appimagetool.sha256
