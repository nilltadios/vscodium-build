# VSCodium 1.139.1 local build

Unofficial Linux x64 VSCodium, based on VS Code 1.139.1, with local version
`1.139.10001`. The incompatible VSCodium patches have been ported. The editor
compiles and passed the full source typecheck. A fresh-source build completed;
the final AppImage was rebuilt after a launcher-lifetime fix and visually checked
on Fedora KDE with an isolated profile. The corrected launch keeps its FUSE mount
and renderer alive without requiring `--wait`.

The installed editor, its launchers, settings, and extensions are unchanged.
This project does not publish releases or install the result automatically.

## Build

Host requirements: Bash, Git, curl, jq, Node 22 or newer, rootless Podman,
ripgrep, binutils, and FUSE support for AppImages. The tested host is Fedora 44
with an AMD Ryzen 7 7735HS. Compilation runs inside Debian bookworm with Node
24.18.0 and npm 11.16.0, limited to four CPUs and 8 GiB RAM, with 12 GiB combined
RAM/swap allowed. The host compiler and Node installation are not changed.

```bash
cd /home/nilllinux22/Documents/VSCodium-Build
bash scripts/timed.sh clean-full-build bash scripts/build.sh
node scripts/report-timings.mjs
```

The driver fetches pinned sources, checks patch hashes, creates a fresh source
copy, installs locked dependencies, compiles, typechecks, checks the artifact,
and packages and checks an AppImage. Expected result: exit 0 and
`dist/VSCodium-local-1.139.10001-x86_64.AppImage`.
Existing output is timestamp-backed up before replacement.

Every timed stage records its exact command, UTC timestamps, elapsed seconds,
exit status, and full output. `TIMINGS.md` is generated from the append-only
`evidence/timings.jsonl`; logs are under `logs/`. The initial cold Git downloads
were not instrumented. Failed and interrupted attempts are retained.

## Timings

Measured on this machine, not a prediction for other systems:

| Run | Seconds | Scope |
| --- | ---: | --- |
| First successful recovery build | 296.051 | Dependency install through editor packaging; caches and partially prepared work already existed |
| Corrected rebuild | 148.161 | Compile and editor packaging with dependencies already installed |
| AppImage packaging | 23.813 | Corrected rebuild compressed into an AppImage |
| Full source typecheck | 22.398 | Corrected source; exit 0 |
| Fresh-source build with caches | 299.570 | Build, typecheck, checks, and initial AppImage packaging; the later normal-launch test found a launcher defect |
| Launcher-fix rebuild | 155.548 | Separate work copy with existing dependencies; editor compilation and packaging |
| Launcher-fix AppImage packaging | 24.594 | Rebuilt editor compressed into the visually verified AppImage |

These are different workloads. They do not establish a cold-versus-warm speedup.
See `TIMINGS.md` for all attempts; overlapping and nested stages must not be added
to estimate total elapsed time.

## What changed

`patches/rebased/` replaces the incompatible upstream patches and adds a final
compatibility patch. `PORTING.md` describes the changes and retired patches.
The fixes cover the esbuild task split, Electron metadata during npm installation,
new Copilot SDK modules, UI font imports and layout APIs, extension-gallery types,
and updater API changes. Privacy-related patches were retained.

The original AppRun launched the CLI, which detached Electron and exited. The
AppImage runtime then unmounted files still needed by Electron, producing SIGBUS
crashes and a misleading missing-module error. AppRun now opts into waiting for
the spawned editor process through `100-appimage-process-lifetime.patch`.
CLI-only operations such as `--version` still return normally. The full source
typecheck preceded this small CLI change; the change was rebuilt and verified
through an actual normal GUI launch, not another full source typecheck.

Pristine checkouts remain under `sources/`. `work/` contains disposable build
copies, dependencies, test profiles, and failed attempts. `evidence/rejects/`
preserves the original rejected hunks. The diagnostic `port-patches.sh` is for
developing a port; do not rerun it over the finalized replacement patches.

## Checks

```bash
bash scripts/typecheck.sh "$(cat work/latest-path.txt)"
node scripts/check-telemetry-defaults.mjs "$(cat work/latest-path.txt)/vscode"
bash scripts/check-artifact.sh "$(cat work/latest-path.txt)/VSCode-linux-x64"
bash scripts/check-appimage.sh "$(cat evidence/latest-appimage.txt)"
bash scripts/verify.sh
sha256sum -c dist/VSCodium-local-1.139.10001-x86_64.AppImage.sha256
```

Expected result for each check: exit 0. AppImage version output:

```text
1.139.10001
9effe6e0e5446759fdb46c56b7f6d71ebfd852fd
x64
```

The middle line is VSCodium's synthetic release commit, not the VS Code source
commit. Actual source pins are recorded below and in the artifact manifest.

The optional desktop smoke test opens an isolated test profile on the selected
KDE monitor for 35 seconds. Check the monitor layout first. It does not read the
installed editor's profile or extensions. Its screenshot requires visual review;
script exit 0 alone is not a GUI pass.
It opens a regular movable window and checks that the mounted editor and renderer
remain alive. It deliberately does not use `--wait`, which masked the old failure.

```bash
kscreen-doctor -o
bash scripts/timed.sh gui-smoke bash scripts/test-gui.sh DP-1
```

The test uses the existing KDE placement/capture helpers under
`/home/nilllinux22/.codex/skills/kde-desktop-app-testing/scripts/`.
Evidence includes the AppImage checksum, isolated-profile path, launch log,
monitor geometry, screenshot, and screenshot metadata.
The September 29 launch repair, screenshots, reproduction scripts, and backups
are in `/home/nilllinux22/Documents/Codex/2026-09-29/vscodium-launch-repair/`.

## Privacy and support limits

The port retains VSCodium's disabled telemetry defaults, disabled experiments,
endpoint replacements, Open VSX gallery, and removal of bundled Copilot/agent
SDKs. Static checks verify those settings, product metadata, dependencies, and
absence of known `*.data.microsoft.com` endpoint strings in the packaged app.
Official automatic updates are disabled so this local build cannot silently
switch to another release channel.

This is not a claim of zero network traffic. Documentation links, extension
downloads, authentication, and installed extensions can contact external services.
No packet-capture privacy audit has been performed. The upstream dependency
installer reports audit warnings; this port is not a dependency security audit.

Only Linux x64 is built here. Windows, macOS, other architectures, remote-server,
and standalone tunnel-CLI targets are not validated. The complete upstream unit,
integration, and smoke suites have not been run. The AppImage packages the
Electron application, not every Linux shared library; portability beyond the
tested Fedora host is not established. This is not an official or signed release.

## Faster future builds

Keep the builder image and `cache/` directories for npm, Electron, headers, and
ccache. Keep a successful work directory for compile-only development retries:

```bash
bash scripts/resume.sh "$(cat work/latest-path.txt)" compile
```

Use `scripts/build.sh` for release candidates, which starts from pristine source.
For a new upstream version, pin both repositories, port and review the patches,
update the builder when `.nvmrc` changes, then run the complete checks again.
Keep the old config, lock, and source checkout before switching pins; the fetcher
deliberately refuses a version mismatch instead of overwriting them. Reuse download
caches, but do not copy `node_modules` across changed lockfiles or Electron ABIs.

This build keeps npm. Bun has not been tested as a replacement for upstream's
lockfile and lifecycle scripts. The cached rebuild is measured; a Bun speedup
is not.

## Sources and rollback

- VS Code tag `1.139.1`, commit `04c0d99f4fb0d8afe6ce4f0c58e31e183ac3e4b1`.
- VSCodium commit `5a73682ca091082675b10c9dc3f348c1d824d94f`.
- Electron `43.6.0`, Microsoft build ID `15274685`.
- `config.json` and `sources.lock.json` pin the repositories.
- `appimagetool.lock.json` and `appimage-runtime.lock.json` pin packaging downloads
  by URL and SHA-256. Their fetch scripts retain source API responses and dates.
- `Containerfile` pins the base image by digest. `evidence/container-image.json`
  records the tested builder. Its Debian packages came from the repositories
  available that day; a later image rebuild is not promised byte-identical.

Source fetch URLs and Git commands are retained in `evidence/fetch-sources.tsv`.
`dist/*.manifest.json` records the artifact hash, source pins, patch-manifest hash,
dependency-lock hash, packaging tools, and builder image.

To discard the work, move this project to Trash after its builds have stopped.
The dedicated builder can be removed with
`podman image rm localhost/vscodium-build:node-24.18.0`.
Do not run a global image/container prune. No host system packages were installed.

Upstream sources:

- https://github.com/microsoft/vscode/releases/tag/1.139.1
- https://github.com/VSCodium/vscodium/tree/5a73682ca091082675b10c9dc3f348c1d824d94f
- https://github.com/VSCodium/vscodium/blob/5a73682ca091082675b10c9dc3f348c1d824d94f/docs/howto-build.md
