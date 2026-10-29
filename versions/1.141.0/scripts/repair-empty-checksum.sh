#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
file=evidence/installed-app-20261002T103959Z.sha256
if [[ -f "$file" ]]; then
  test ! -s "$file"
  mv "$file" "$file.failed-empty"
fi
# Retain the failed initial checksum file, but exclude it from valid manifests.
bash scripts/timed.sh project-check-repaired bash scripts/verify.sh
