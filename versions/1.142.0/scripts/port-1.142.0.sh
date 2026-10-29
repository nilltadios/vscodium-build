#!/usr/bin/env bash
# Rebuild the 1.142.0 porting tree from scratch:
#   1.141.2 rebased patches (minus its local port patch) -> port-patches.sh (rebase with --reject)
#   -> replay the 1.141.2 port patch -> port-rejects.mjs on both reject sets (exactly once)
#   -> finalize-port-1.142.0.mjs (manual resolutions, if present).
# Resets patches/rebased/ and evidence/rejects*/ first, so it is safe to rerun.
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
reference=evidence/patches-1.141.2-reference/rebased
rm -rf patches/rebased evidence/rejects evidence/rejects-port-1.141.2 evidence/merge-conflicted
mkdir -p patches
cp -a "$reference" patches/rebased
rm patches/rebased/user/zzzz-port-1.141.2.patch
bash scripts/prepare-work.sh
bash scripts/port-patches.sh > /dev/null 2>&1
bash scripts/replay-port-1.141.2.sh > /dev/null 2>&1
node scripts/port-rejects.mjs evidence/rejects
node scripts/port-rejects.mjs evidence/rejects-port-1.141.2
bash scripts/merge-from-1.141.2.sh $(cat evidence/merge-files.txt)
node scripts/prune-providers.mjs
if [[ -f scripts/finalize-port-1.142.0.mjs ]]; then node scripts/finalize-port-1.142.0.mjs; fi
printf 'Porting tree: %s/vscode\n' "$(cat work/latest-path.txt)"
# Regenerate npm lockfiles for the edited package.json files, in the builder container.
target=$(cat work/latest-path.txt)
podman run --rm --userns=keep-id --cpus=4 --memory=8g --memory-swap=12g --security-opt=no-new-privileges --cap-drop=all \
  -v "$project:/project:z" -e HOME=/project/cache/home localhost/vscodium-build:node-24.18.0 \
  bash /project/scripts/refresh-locks.sh "/project/${target#"$project/"}/vscode"
printf 'Locks refreshed: %s/vscode\n' "$target"
