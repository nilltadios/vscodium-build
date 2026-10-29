#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
mkdir -p cache/tools evidence
lock=appimage-runtime.lock.json
if [[ ! -f "$lock" ]]; then
  url=https://api.github.com/repos/AppImage/type2-runtime/releases/latest
  curl --fail --location --retry 3 "$url" -o evidence/appimage-runtime-release.json
  jq --arg url "$url" --arg fetched_at "$(date -u +%FT%TZ)" '
    . as $release | .assets[] | select(.name == "runtime-x86_64") |
    {tag: $release.tag_name, source: $url, fetched_at: $fetched_at,
     url: .browser_download_url, digest: .digest}' evidence/appimage-runtime-release.json > "$lock"
  test -s "$lock"
fi
tool=cache/tools/runtime-x86_64
if [[ ! -f "$tool" ]]; then
  # APPIMAGE_TOOLS_MIRROR: base URL holding the same pinned files (upstream "continuous" moves);
  # the digest check below still applies.
  url=$(jq -r .url "$lock")
  [[ -n ${APPIMAGE_TOOLS_MIRROR:-} ]] && url="${APPIMAGE_TOOLS_MIRROR%/}/$(basename "$tool")"
  curl --fail --location --retry 3 "$url" -o "$tool.part"
  mv "$tool.part" "$tool"
fi
digest=$(jq -r '.digest // empty' "$lock")
[[ "$digest" == sha256:* ]]
printf '%s  %s\n' "${digest#sha256:}" "$tool" | sha256sum --check
sha256sum "$tool" > evidence/appimage-runtime.sha256
