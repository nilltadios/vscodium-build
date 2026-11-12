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
# VSCodium's removal lists (patches/*.json) target its own VS Code version, and apply_actions aborts on a path
# that no longer exists. A path the new upstream already deleted needs no removal: drop it from the work copy
# and record it, so a newer release that deletes a file first does not stop the port or the build.
absent="$project/evidence/absent-removals.txt"
: > "$absent"
for json in "$target"/patches/*.json; do
  [[ -f $json ]] || continue
  while IFS= read -r path; do
    [[ -e $target/vscode/$path ]] || printf '%s\t%s\n' "$(basename "$json")" "$path" >> "$absent"
  done < <(jq -r '.[] | select(.action == "remove") | .paths[]' "$json")
  if rg -q -F "$(basename "$json")" "$absent"; then
    jq --rawfile gone <(awk -F'\t' -v f="$(basename "$json")" '$1 == f { print $2 }' "$absent") '
      ($gone | split("\n") | map(select(. != ""))) as $g
      | map(if .action == "remove" then .paths -= $g else . end)' "$json" > "$json.tmp"
    mv "$json.tmp" "$json"
  fi
done
[[ -s $absent ]] && printf 'Removal paths already absent upstream (skipped):\n' && sed 's/^/  /' "$absent"
node "$project/scripts/vscodium-pnpm.mjs" "$target"
bash "$project/scripts/apply-branding.sh" "$target"
printf '%s\n' "$target" > "$project/work/latest-path.txt"
printf 'Fresh build directory: %s\n' "$target"
