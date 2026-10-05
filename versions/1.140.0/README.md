# VSCodium local build based on VS Code 1.140.0

Unofficial Linux x64 build, local version `1.140.00001`. This directory keeps
the previous 1.139 build and installed AppImage separate from this candidate.
Build and verification status are recorded in `STATUS.md` when checks finish.

Run a fresh build from this directory:

```bash
bash scripts/timed.sh full-build-1.140 bash scripts/build.sh
```

Expected result: exit 0 and
`dist/VSCodium-local-1.140.00001-x86_64.AppImage`, with its SHA-256 and manifest.
The driver starts from pristine source, validates patch hashes, installs locked
dependencies, compiles, checks telemetry defaults, typechecks, packages, and
checks the AppImage. Exact commands, timestamps, exit statuses, and complete
logs are retained in `evidence/timings.jsonl` and `logs/`.

```bash
sha256sum -c dist/VSCodium-local-1.140.00001-x86_64.AppImage.sha256
bash scripts/check-appimage.sh dist/VSCodium-local-1.140.00001-x86_64.AppImage
bash scripts/verify.sh
node scripts/verify-final.mjs
bash scripts/check-test-cleanup.sh
```

Expected result for each check: exit 0. The version command reports
`1.140.00001` and `x64`. Its middle line is VSCodium's synthetic release commit;
the real source commits are in `sources.lock.json` and the artifact manifest.

The desktop test uses a separate profile. It opens a movable window on the
selected KDE output, captures that output, checks the mounted main process
and renderer, and closes its own test instance after 35 seconds:

```bash
kscreen-doctor -o
bash scripts/timed.sh gui-smoke bash scripts/test-gui.sh DP-1
```

Review the screenshot linked by `evidence/latest-gui.txt` before calling that
check a visual pass. The test uses normal launch behavior without `--wait`.

The build uses the existing rootless Debian builder with Node 24.18.0, four
CPUs, 8 GiB RAM, and a 12 GiB combined RAM/swap limit. Host packages are unchanged.
Caches were copied using filesystem reflinks from the prior project.

The port retains disabled telemetry and experiment defaults, endpoint
replacement, Open VSX, bundled provider SDK removal, and the AppImage process
lifetime fix. Automatic updates are disabled for this unofficial build.
Static checks are not a packet-capture audit. User-installed extensions have
their own network behavior. Other architectures, operating systems, server
targets, and the complete upstream test suites are not validated here.
Dependency installation reported npm audit findings, retained in the build
logs. This port does not include a dependency security audit.

Source pins:

- VS Code `07f806f999227108933c2e30515b26eecc1fda74`, tag `1.140.0`.
- VSCodium build scripts `5a73682ca091082675b10c9dc3f348c1d824d94f`.

Source URLs and fetch commands are saved in `scripts/fetch.sh` and
`evidence/fetch-sources.tsv`. Upstream release:
https://github.com/microsoft/vscode/releases/tag/1.140.0

To undo this task, remove only this version directory and the dated setup
bundle after its build/test processes stop. The original project, installed
AppImage, settings, and extensions are not replaced by the build driver.
