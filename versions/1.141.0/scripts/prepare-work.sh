#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
stamp=$(date -u +%Y%m%dT%H%M%S%NZ)
mkdir -p "$project/work"
target="$project/work/$stamp"
cp -a --reflink=auto "$project/sources/vscodium" "$target"
cp -a --reflink=auto "$project/sources/vscode" "$target/vscode"
if [[ -d "$project/patches/rebased" ]]; then
  while IFS= read -r -d '' patch; do
    relative=${patch#"$project/patches/rebased/"}
    if [[ -s "$patch" ]]; then
      mkdir -p "$(dirname "$target/patches/$relative")"
      cp "$patch" "$target/patches/$relative"
    elif [[ -f "$target/patches/$relative" ]]; then
      # Empty replacements retire patches for code removed upstream.
      mv "$target/patches/$relative" "$target/patches/$relative.retired"
    fi
  done < <(find "$project/patches/rebased" -type f -print0)
fi
bash "$project/scripts/apply-branding.sh" "$target"
printf '%s\n' "$target" > "$project/work/latest-path.txt"
printf 'Fresh build directory: %s\n' "$target"
