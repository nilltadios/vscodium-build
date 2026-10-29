#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project"
mkdir -p cache/home cache/npm cache/electron cache/xdg cache/ccache logs evidence dist
timed() { bash "$project/scripts/timed.sh" "$@"; }
timed fetch bash scripts/fetch.sh
timed patch-integrity sha256sum -c evidence/port-patches.sha256
timed prepare-work bash scripts/prepare-work.sh
node_version=$(tr -d '\n' < sources/vscode/.nvmrc)
image=localhost/vscodium-build:node-$node_version
if podman image exists "$image"; then
  timed container-image-reuse podman image inspect "$image" --format '{{.Id}}'
else
  timed container-image podman build -t "$image" -f Containerfile .
fi
podman image inspect "$image" > evidence/container-image.json
target=$(cat work/latest-path.txt)
container_target="/project/${target#"$project/"}"
# CI runners may not delegate cgroup controllers to rootless podman; they set PODMAN_LIMITS="".
read -ra limits <<< "${PODMAN_LIMITS---cpus=4 --memory=8g --memory-swap=12g}"
timed editor-build podman run --rm --name "vscodium-build-$(date +%s)" \
  --userns=keep-id "${limits[@]}" \
  --security-opt=no-new-privileges --cap-drop=all \
  -v "$project:/project:z" -e HOME=/project/cache/home \
  "$image" bash /project/scripts/container-build.sh "$container_target"
printf 'Editor build complete: %s/VSCode-linux-x64\n' "$target"
timed telemetry-defaults node scripts/check-telemetry-defaults.mjs "$target/vscode"
bash scripts/typecheck.sh "$target"
timed electron-version-test podman run --rm --userns=keep-id \
  --security-opt=no-new-privileges --cap-drop=all -v "$project:/project:z" \
  "$image" node /project/scripts/test-electron-version.mjs "$container_target/vscode"
timed artifact-check bash scripts/check-artifact.sh "$target/VSCode-linux-x64"
timed appimage-package bash scripts/package-appimage.sh "$target"
timed appimage-check bash scripts/check-appimage.sh "$(cat evidence/latest-appimage.txt)"
timed manifest node scripts/write-manifest.mjs "$target"
timed project-check bash scripts/verify.sh
node scripts/report-timings.mjs
printf 'Verified local AppImage: %s\n' "$(cat evidence/latest-appimage.txt)"
printf 'GUI smoke testing is separate: bash scripts/test-gui.sh <monitor>\n'
