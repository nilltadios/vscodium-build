#!/usr/bin/env bash
# Start (or resume) the port of the local VSCodium build from one VS Code release to the next.
# Usage, from anywhere:
#   bash scripts/update/update.sh <prev> <new> [--workspace DIR] [--sources-from DIR] [--vscodium-commit SHA]
#                                              [--offline] [--no-port]
#   <prev>, <new>  VS Code versions; versions/<prev> must hold a finished build (its work/latest-path.txt tree is
#                  the "ours" side of the three-way merge).
#   --workspace    where to create the new workspace (default versions/<new>). An existing directory is reused
#                  only if it has port.json (created here), so finished workspaces are never overwritten.
#   --sources-from reflink sources/ and sources.lock.json from another workspace of the same release instead of
#                  fetching (used to replay a finished port).
#   --vscodium-commit pin a different VSCodium build-scripts/patches commit (default: keep <prev>'s). VSCodium's
#                  revised patches replace ours: if the commit targets <new>, the workspace starts from its patches
#                  (port.json mode vscodium-rebase); if it targets <prev>, versions/<prev>-vscodium-<sha7> is first
#                  rebuilt from them in that mode and the port starts from there.
#   --from-workspace DIR  use DIR instead of versions/<prev> as the previous finished workspace.
#   --release-version V   local version (default <new> with 0001 appended, e.g. 1.144.00001).
#   --rebase       (used internally) create the workspace in vscodium-rebase mode.
#   --keep-vscodium-pin keep <prev>'s VSCodium commit even though upstream master moved (a new workspace
#                  otherwise stops, so a stale pin is a decision; check-upstreams.sh lists the commits).
#   --offline      skip the upstream VSCodium check.
#   --no-port      create the workspace only.
# Then: bash <workspace>/scripts/port.sh is run (rerun it after editing scripts/finalize-port-<new>.mjs), and
# when it reports clean: bash <workspace>/scripts/release.sh <monitor>.
# Creates only the workspace directory. Undo: move it to Trash (gio trash <workspace>).
set -euo pipefail
repo=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
template=$repo/scripts/update
prev=${1:?Usage: update.sh <prev> <new> [options]}; next=${2:?Usage: update.sh <prev> <new> [options]}; shift 2
ws=$repo/versions/$next sources_from= codium_commit= offline=0 run_port=1 keep_pin=0 explicit_commit=0 rebase=0 from_ws= release_override=
while (($#)); do
  case $1 in
    --workspace) ws=$(realpath -m "$2"); shift 2 ;;
    --sources-from) sources_from=$(realpath "$2"); shift 2 ;;
    --vscodium-commit) codium_commit=$2; explicit_commit=1; shift 2 ;;
    --keep-vscodium-pin) keep_pin=1; shift ;;
    --from-workspace) from_ws=$(realpath "$2"); shift 2 ;;
    --release-version) release_override=$2; shift 2 ;;
    --rebase) rebase=1; shift ;;
    --offline) offline=1; shift ;;
    --no-port) run_port=0; shift ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; exit 2 ;;
  esac
done
prev_dir=${from_ws:-$repo/versions/$prev}
[[ $next =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] || { printf 'Expected a version like 1.142.0, got %s\n' "$next" >&2; exit 2; }
release_version=${release_override:-"${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.${BASH_REMATCH[3]}0001"}
[[ -f $prev_dir/config.json && -f $prev_dir/work/latest-path.txt ]] || { printf 'No finished workspace at %s\n' "$prev_dir" >&2; exit 2; }
[[ -d $(cat "$prev_dir/work/latest-path.txt")/vscode ]] || { printf 'The previous patched tree is gone: %s\n' "$(cat "$prev_dir/work/latest-path.txt")" >&2; exit 2; }
codium_commit=${codium_commit:-$(jq -r .vscodium_commit "$prev_dir/config.json")}

if [[ $offline -eq 0 ]]; then
  # A newer upstream VSCodium may already carry patches for this release (the fast 1.141.2 port did).
  upstream=$(timeout 20 git ls-remote https://github.com/VSCodium/vscodium.git refs/heads/master 2>/dev/null | cut -f1 || true)
  tags=$(timeout 20 git ls-remote --tags --refs https://github.com/VSCodium/vscodium.git "refs/tags/$next.*" 2>/dev/null | sed 's|.*refs/tags/||' | tr '\n' ' ' || true)
  printf 'Upstream VSCodium: master %s (pinned %s); release tags for %s: %s\n' "${upstream:-unknown}" "$codium_commit" "$next" "${tags:-none}"
  if [[ -n $upstream && $upstream != "$codium_commit" ]]; then
    # A new workspace must not silently keep a stale VSCodium pin: pick one explicitly (2026-10-29: the 1.144.0
    # port kept be70704 while master carried 8 newer commits, including new patches).
    if [[ ! -e $ws && $keep_pin -eq 0 && $explicit_commit -eq 0 ]]; then
      printf 'STOP: VSCodium master %s differs from the pin %s. Rerun with --vscodium-commit %s to port onto it,\n' "$upstream" "$codium_commit" "$upstream" >&2
      printf '      or --keep-vscodium-pin to keep the old pin. See: bash scripts/update/check-upstreams.sh\n' >&2
      exit 3
    fi
    printf 'NOTE: VSCodium master moved. If it has patches for %s, rerun with --vscodium-commit %s to start from them.\n' "$next" "$upstream"
  fi
fi

prev_codium=$(jq -r .vscodium_commit "$prev_dir/config.json")
if [[ $rebase -eq 0 && $codium_commit != "$prev_codium" && ! -e $ws ]]; then
  # Our rebased patches descend from the previous VSCodium commit; reusing them would hide VSCodium's revisions
  # (2026-10-29: only new files got through and the new removal list broke 11 imports). Start from its patches.
  target=$(timeout 30 curl -fsSL "https://raw.githubusercontent.com/VSCodium/vscodium/$codium_commit/upstream/stable.json" | jq -r .tag) ||
    { printf 'Cannot read upstream/stable.json of VSCodium %s.\n' "$codium_commit" >&2; exit 2; }
  if [[ $target == "$next" ]]; then
    rebase=1
  elif [[ $target == "$prev" ]]; then
    rws=$(dirname "$prev_dir")/$prev-vscodium-${codium_commit:0:7}
    printf 'VSCodium %s targets VS Code %s: rebuilding that release from its patches in %s first.\n' "${codium_commit:0:7}" "$prev" "$rws"
    bash "${BASH_SOURCE[0]}" "$prev" "$prev" --from-workspace "$prev_dir" --workspace "$rws" \
      --vscodium-commit "$codium_commit" --rebase --offline || exit $?
    prev_dir=$rws prev_codium=$codium_commit
  else
    printf 'STOP: VSCodium %s targets VS Code %s, neither %s nor %s.\n' "${codium_commit:0:7}" "$target" "$prev" "$next" >&2; exit 3
  fi
fi

if [[ -e $ws && ! -f $ws/port.json ]]; then
  printf '%s exists and was not created by update.sh; refusing to touch it. Use --workspace.\n' "$ws" >&2; exit 2
fi
if [[ ! -e $ws ]]; then
  mkdir -p "$ws"/{evidence,logs,dist,work,patches,sources}
  for f in Containerfile .containerignore .gitignore appimage-runtime.lock.json appimagetool.lock.json; do
    [[ -e $prev_dir/$f ]] && cp -a "$prev_dir/$f" "$ws/"
  done
  cp -a --reflink=auto "$prev_dir/assets" "$prev_dir/cache" "$ws/"
  rm -rf "$ws/cache/port-deps"
  # Generic scripts only: no version-named one-offs or backups, and not the legacy 1.139/1.140 helpers.
  mkdir -p "$ws/scripts"
  legacy='^(finalize-port|fix-typecheck|restore-static-types|reconcile|export-missing-deletions|missing-imports|compare-typecheckers)\.mjs$|^(update-port-work|repair-empty-checksum|resume|resume-container)\.sh$'
  for f in "$prev_dir"/scripts/*; do
    name=$(basename "$f")
    [[ $name =~ [0-9]+\.[0-9]+ || $name == *.bak-* || $name =~ $legacy ]] && continue
    cp -a "$f" "$ws/scripts/"
  done
  cp -a "$template"/workspace/. "$ws/scripts/"
  if [[ $rebase -eq 1 ]]; then
    f=finalize-rebase-$next-${codium_commit:0:7}.mjs
  else
    f=finalize-port-$next.mjs
  fi
  [[ -f $template/finalize/$f ]] && cp -a "$template/finalize/$f" "$ws/scripts/"
  [[ $rebase -eq 0 && -f $template/finalize/finalize-port-$next-${codium_commit:0:7}.mjs ]] &&
    cp -a "$template/finalize/finalize-port-$next-${codium_commit:0:7}.mjs" "$ws/scripts/"
  jq --arg v "$next" --arg r "$release_version" --arg c "$codium_commit" \
    '.vscode_version=$v | .release_version=$r | .vscodium_commit=$c' "$prev_dir/config.json" > "$ws/config.json"
  from_dir=$(realpath --relative-to="$ws" "$prev_dir")
  mode=port; [[ $rebase -eq 1 ]] && mode=vscodium-rebase
  jq -n --arg from "$prev" --arg dir "$from_dir" --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg mode "$mode" \
    '{from:$from, from_dir:$dir, mode:$mode, created_at:$at, created_by:"scripts/update/update.sh"}' > "$ws/port.json"
  mkdir -p "$ws/evidence/patches-$prev-reference"
  cp -a "$prev_dir/patches/rebased" "$ws/evidence/patches-$prev-reference/rebased"
  if [[ -n $sources_from ]]; then
    test "$(jq -r .vscode_version "$sources_from/sources.lock.json")" = "$next"
    test "$(jq -r .vscodium_commit "$sources_from/sources.lock.json")" = "$codium_commit"
    cp -a --reflink=auto "$sources_from/sources/vscode" "$sources_from/sources/vscodium" "$ws/sources/"
    cp -a "$sources_from/sources.lock.json" "$ws/"
  else
    if [[ $prev_codium == "$codium_commit" ]]; then
      cp -a --reflink=auto "$prev_dir/sources/vscodium" "$ws/sources/"
    fi
  fi
  printf 'Created %s from %s (scripts overlaid from %s).\n' "$ws" "$prev_dir" "$template/workspace"
fi

cd "$ws"
# fetch.sh resolves the commit for the tag (when sources.lock.json is absent) and shallow-fetches missing sources.
bash scripts/timed.sh fetch bash scripts/fetch.sh
node_version=$(tr -d '\n' < sources/vscode/.nvmrc)
image_node=$(sed -nE 's/.*library\/node:([0-9.]+)-.*/\1/p' Containerfile | head -n 1)
if [[ $image_node != "$node_version" ]]; then
  # Reuse a builder definition another workspace already pins (tag and digest) for this Node version.
  match=$(grep -l -E "library/node:$node_version-[a-z]+@sha256:" "$repo"/versions/*/Containerfile 2>/dev/null | head -n 1 || true)
  if [[ -n $match ]]; then
    cp Containerfile "Containerfile.bak-$(date +%Y%m%dT%H%M%S)"; cp "$match" Containerfile; image_node=$node_version
    printf 'Containerfile: Node %s builder taken from %s\n' "$node_version" "$match"
  fi
fi
if [[ $image_node != "$node_version" ]]; then
  printf 'STOP: %s needs Node %s but Containerfile pins node:%s. Update BASE_IMAGE (tag and digest) first.\n' "$next" "$node_version" "$image_node" >&2
  exit 3
fi
if ! podman image exists "localhost/vscodium-build:node-$node_version"; then
  bash scripts/timed.sh container-image podman build -t "localhost/vscodium-build:node-$node_version" -f Containerfile .
fi
if [[ $run_port -eq 1 ]]; then
  bash scripts/timed.sh port bash scripts/port.sh
fi
