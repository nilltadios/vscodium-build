#!/usr/bin/env bash
# Rebuild this version's porting tree from scratch and report what is left to resolve. Safe to rerun; it
# resets patches/rebased/ and evidence/{port,rejects*,merge-conflicted}/ first.
#   previous rebased patches (minus the previous port patch) -> prepare-work -> port-patches (rebase, --reject)
#   -> replay the previous port patch -> port-rejects.mjs on both reject sets -> merge-files.mjs picks the files
#   still unresolved -> merge-from.sh (three-way: previous patched tree / previous pristine / new pristine)
#   -> prune-providers.mjs -> finalize-port-<version>.mjs (per-version conflict picks, if present)
#   -> port-rules.mjs (recurring resolutions) -> refresh-locks -> port-deps.sh (npm ci of the new lockfile)
#   -> typecheck -> report; when clean, export-port.sh and a check-patches probe.
# Usage: bash scripts/port.sh [--no-export]
# Inputs: port.json {from, from_dir}, config.json, evidence/patches-<from>-reference/rebased.
# Output: evidence/port/report.md (printed), per-step logs in evidence/port/. Exit 0 only when clean.
set -uo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
export_when_clean=1
[[ ${1:-} == --no-export ]] && export_when_clean=0
prev=$(jq -r .from port.json)
prev_dir=$(realpath "$(jq -r .from_dir port.json)")
next=$(jq -r .vscode_version config.json)
node_version=$(tr -d '\n' < sources/vscode/.nvmrc)
image=localhost/vscodium-build:node-$node_version
reference=evidence/patches-$prev-reference/rebased
out=evidence/port
[[ -d $reference ]] || { printf 'Missing %s (update.sh creates it).\n' "$reference" >&2; exit 2; }
[[ -f $prev_dir/work/latest-path.txt ]] || { printf 'Missing the previous patched tree: %s/work/latest-path.txt\n' "$prev_dir" >&2; exit 2; }

rm -rf "$out" patches/rebased evidence/rejects "evidence/rejects-port-$prev" evidence/merge-conflicted
mkdir -p "$out" patches
cp -a "$reference" patches/rebased
prev_port=$(find "$reference/user" -name 'zzzz-port-*.patch' 2>/dev/null | head -n 1)
find patches/rebased/user -name 'zzzz-port-*.patch' -delete 2>/dev/null
printf 'step\texit\tseconds\n' > "$out/steps.tsv"
step() {  # step <name> <command...>: log to $out/<name>.txt, record exit and duration
  local name=$1 start=$SECONDS status; shift
  printf '== %s\n' "$name"
  "$@" > "$out/$name.txt" 2>&1; status=$?
  printf '%s\t%s\t%s\n' "$name" "$status" "$((SECONDS - start))" >> "$out/steps.tsv"
  return "$status"
}
abort() { node scripts/port-report.mjs | tee "$out/report.md"; exit 1; }

step prepare-work bash scripts/prepare-work.sh || abort
tree=$(cat work/latest-path.txt)/vscode
printf '%s\n' "$tree" > "$out/port-tree.txt"
step port-patches bash scripts/port-patches.sh || abort
if [[ -n $prev_port ]]; then
  step replay-port bash scripts/replay-port.sh "$prev_port" "evidence/rejects-port-$prev" || abort
fi
step port-rejects-patches node scripts/port-rejects.mjs evidence/rejects
[[ -d evidence/rejects-port-$prev ]] && step port-rejects-replay node scripts/port-rejects.mjs "evidence/rejects-port-$prev"
node scripts/merge-files.mjs "$out"/port-rejects-*.txt > "$out/merge-files.txt"
mapfile -t merge_files < "$out/merge-files.txt"
step merge bash scripts/merge-from.sh "$prev_dir" "${merge_files[@]}"
while IFS=$'\t' read -r conflicts file; do
  [[ $conflicts =~ ^[1-9][0-9]*$ ]] || continue
  mkdir -p "evidence/merge-conflicted/$(dirname "$file")"
  cp "$tree/$file" "evidence/merge-conflicted/$file"
done < "$out/merge.txt"
step prune node scripts/prune-providers.mjs
if [[ -f scripts/finalize-port-$next.mjs ]]; then
  step finalize node "scripts/finalize-port-$next.mjs"
else
  printf 'No scripts/finalize-port-%s.mjs yet.\n' "$next" > "$out/finalize.txt"
  printf 'finalize\tmissing\t0\n' >> "$out/steps.tsv"
fi
step rules node scripts/port-rules.mjs
# Conflict markers anywhere the merge wrote (finalize may not cover every file yet).
: > "$out/markers.txt"
if [[ ${#merge_files[@]} -gt 0 ]]; then
  (cd "$tree" && grep -l -E '^(<<<<<<<|>>>>>>>) ' -- "${merge_files[@]}" 2>/dev/null) > "$out/markers.txt"
fi
step refresh-locks podman run --rm --userns=keep-id --cpus=4 --memory=8g --memory-swap=12g \
  --security-opt=no-new-privileges --cap-drop=all -v "$project:/project:z" -e HOME=/project/cache/home "$image" \
  bash /project/scripts/refresh-locks.sh "/project/${tree#"$project/"}"
if step deps bash scripts/port-deps.sh "$tree"; then
  deps=$(tail -n 1 "$out/deps.txt")
  if [[ -s $out/markers.txt ]]; then
    printf 'Skipped: conflict markers remain (see markers.txt).\n' > "$out/typecheck.txt"
    printf 'typecheck\tskipped\t0\n' >> "$out/steps.tsv"
  else
    # New-release packages from the fresh install; Electron typings (.build) and build/ tooling from the
    # previous build tree. The links are removed again so export-port.sh cannot pick them up.
    ln -sfn "$deps/node_modules" "$tree/node_modules"
    prev_tree=$(cat "$prev_dir/work/latest-path.txt")/vscode
    step typecheck bash scripts/typecheck-port.sh "$tree" "$prev_tree"
    rm -f "$tree/node_modules" "$tree/.build" "$tree/build/node_modules"
  fi
fi
node scripts/port-report.mjs > "$out/report.md"; report_status=$?
cat "$out/report.md"
if [[ $report_status -eq 0 && $export_when_clean -eq 1 ]]; then
  step export bash scripts/export-port.sh "$(dirname "$tree")" || exit 1
  step check-prepare bash scripts/prepare-work.sh || exit 1
  step check-patches bash scripts/check-patches.sh; probe=$?
  grep 'Patch probe' "$out/check-patches.txt"
  [[ $probe -eq 0 ]] || exit 1
  # Applying cleanly is not enough (a dropped deletion still applies): the result must equal the porting tree.
  step tree-check bash scripts/tree-check.sh "$tree" "$(cat work/latest-path.txt)/vscode"; same=$?
  tail -n 1 "$out/tree-check.txt"
  [[ $same -eq 0 ]] || exit 1
  printf 'Exported and verified: %s\n' "$(tail -n 1 "$out/export.txt")"
fi
exit "$report_status"
