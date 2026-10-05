# VSCodium 1.139.1 port

This is an unofficial Linux x64 port, not a published VSCodium release. The exact upstream commits are in `sources.lock.json`. Original checkouts remain unchanged under `sources/`.

## Changes under review

- Rebased VSCodium's patches against the pinned VS Code 1.139.1 source. `patches/rebased/` contains the replacements; `evidence/rejects/` and the port logs retain the original failures.
- Retired the old `buildConfig.ts` esbuild switch, TypeScript mangler patch, removed terminal-regex hunk, and `optimize.ts` non-ASCII patch. Those code paths no longer exist. The existing esbuild no-private-mangling change remains applied.
- Recreated VSCodium's prepack/packing tasks using the new esbuild-only pipeline. The desktop bundle is built before platform packaging.
- Updated UI font imports, dependency injection, notification dimensions, and activity-bar sizing for upstream's layout changes.
- Updated the Copilot removal for new SDK modules and provider registration. Removed tests only for components no longer shipped; retained the shared sandbox tests.
- Regenerated the root, build, and remote npm lockfiles after dependency substitutions and removals. Kept npm and the upstream Node version.
- Made Electron metadata lookup use VSCodium's saved `.npmrc.bak` during host-Node dependency installation. `scripts/test-electron-version.mjs` covers normal metadata, the temporary npmrc, and the version override.
- Adapted Windows updater signatures and cancellation to the new API, but Windows, macOS, server, and non-x64 builds are not validated here.

## Build-runner fixes

AppImage GUI lifetime is retained through the opt-in
`VSCODIUM_APPIMAGE_WAIT_FOR_EXIT=1` environment variable set by AppRun. The
additional user patch waits for the CLI's spawned Electron process before the
CLI exits. Without this, the runtime tears down its FUSE mount while the editor
is still using mapped libraries. The CLI-only version path remains unchanged.
The desktop test now uses normal launch behavior, checks the mounted main process
and renderer, and opens a movable window. Its previous `--wait` flag masked this
failure. Final GUI evidence is in the dated launch-repair bundle linked in README.

Container bind mounts use Podman's shared `:z` label because more than one build/test container can access the project. A private `:Z` mount caused SELinux permission failures during the first parallel check. No host security enforcement was disabled.

`scripts/resume.sh` can continue an idle work directory at `install`, `postinstall`, or `compile`. These are development recovery steps, not a replacement for validating a fresh patched source copy. Use `postinstall` only when root dependencies completed successfully.

The build uses four CPUs, an 8 GiB memory limit, and a 12 GiB memory-plus-swap limit. A full-source type-check was killed with a 3 GiB limit; that attempt is recorded as failed, not passed. Run large checks serially.

Compiler, npm, Electron, and header caches live under `cache/`. `ccache` is on the compiler path for subsequent builds. Cache existence does not establish a measured speedup; compare successful cold and warm runs using `evidence/timings.jsonl`.

## Privacy scope

Keep the VSCodium telemetry-default, experiment-disable, endpoint-replacement, Open VSX, and Copilot-removal changes. The local build disables official automatic updates to avoid switching this custom build to another channel.

These checks concern the editor and its bundled components. Installing an extension can add its own telemetry or network behavior. A successful compile alone is not a network/privacy audit.

## Reproduction and checks

`bash scripts/build.sh` creates a fresh build copy and records stage durations, exit codes, exact commands, and logs. `bash scripts/verify.sh` checks pins, shell syntax, pristine sources, the installed AppImage checksum, and home-folder hygiene.

`bash scripts/port-patches.sh` is a diagnostic porting tool, not a release builder. It deliberately keeps successful hunks and saves rejects. Only the checked replacement patch set is used by `scripts/build.sh`.

Status, timings, and remaining failures are recorded in `README.md` and the append-only logs. Until compilation, type-checking, packaging, and launch checks pass, do not describe this as release-ready.
