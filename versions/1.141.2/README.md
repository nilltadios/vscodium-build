# VSCodium local build based on VS Code 1.141.2

Unofficial Linux x64 build, local version `1.141.20001`. This directory keeps
the 1.139, 1.140 and 1.141.0 builds and the installed AppImage separate from
this candidate. Build and verification status are recorded in `STATUS.md` when
checks finish.

Run a fresh build from this directory:

```bash
bash scripts/timed.sh full-build-1.141.2 bash scripts/build.sh
```

Expected result: exit 0 and
`dist/VSCodium-local-1.141.20001-x86_64.AppImage`, with its SHA-256 and manifest.
The driver starts from pristine source, validates patch hashes, installs locked
dependencies, compiles, checks telemetry defaults, typechecks, packages, and
checks the AppImage. Exact commands, timestamps, exit statuses, and complete
logs are retained in `evidence/timings.jsonl` and `logs/`.

```bash
sha256sum -c dist/VSCodium-local-1.141.20001-x86_64.AppImage.sha256
bash scripts/check-appimage.sh dist/VSCodium-local-1.141.20001-x86_64.AppImage
bash scripts/verify.sh
node scripts/verify-final.mjs
bash scripts/check-test-cleanup.sh
```

Expected result for each check: exit 0. The version command reports
`1.141.20001` and `x64`. Its middle line is VSCodium's synthetic release commit;
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
Sources and caches were copied using filesystem reflinks from `versions/1.141.0`.

Source pins:

- VS Code `16507d91be0dc1ce4f94c04d4d0430210b8685d9`, tag `1.141.2`.
- VSCodium build scripts and patches `be70704abf84fc6c7721f94478dfcccd2dc6163e`
  (upstream release `1.140.06880`, whose patches target VS Code 1.140.0).

Source URLs and fetch commands are in `scripts/fetch.sh` and
`evidence/fetch-sources.tsv`. Upstream release:
https://github.com/microsoft/vscode/releases/tag/1.141.2

`scripts/fetch.sh` records the checksum of the installed AppImage, now
`~/AppImages/vscodium.appimage` (override with `INSTALLED_APPIMAGE=`), so
`verify.sh` can show the build left it unchanged.

## Port

Earlier local builds carried their own ports of VSCodium's 1.135 patches
(`99-port-1.139.1`, `zz-port-1.140.0`, `zzz-retire-provider-files`,
`zzzz-port-1.141.0`). VSCodium `be70704` ships its own 1.140 ports, including
the AI SDK removal list `52-ext-copilot-remove-it.json`, the new
`@vscodium/os-proxy-resolver`, and the libasound fix. This port therefore starts
from upstream's patches alone and keeps only one local behavior patch,
`user/100-appimage-process-lifetime.patch`. The 1.141.0 patch set is kept for
reference in `evidence/patches-1.141.0-reference/`.

On VS Code 1.141.2, 10 of 57 upstream patches had rejected hunks (64 hunks). No
rejected file changed between 1.141.0 and 1.141.2; all rejects come from
1.140 → 1.141 drift. Resolution, reproducible on a fresh tree in this order:

1. `prepare-work.sh` then `port-patches.sh`: apply with `--reject`, write each
   rebased patch to `patches/rebased/`, keep rejects in `evidence/rejects/`.
2. `port-rejects.mjs`: reapply uniquely matching rejected hunks (23 applied).
3. `prune-providers.mjs`: remove SDK-importing agent-host modules and tests new
   in 1.141 and absent from upstream's removal list.
4. `finalize-port-1.141.2.mjs` and `finalize-port-1.141.2-typecheck.mjs`:
   manual resolutions, each commented with its reason (several reuse the 1.141.0
   fixes for files unchanged since then).
5. `refresh-locks.sh` in the builder container: regenerate the npm lockfiles.
6. `export-port-1.141.2.sh`: export the result as `user/zzzz-port-1.141.2.patch`
   and refresh `evidence/port-patches.sha256`.

Check: `bash scripts/prepare-work.sh && bash scripts/check-patches.sh` reports
59 applied, 0 failed. The tree it produces is byte-identical to the hand-ported
tree (`diff -rq` excluding `.git` and dependencies, exit 0).

`scripts/missing-imports.mjs <root> <files...>` lists relative imports whose
targets are missing. It was used to find modules still importing removed files.

Scripts named `*-1.141.mjs`, `*-1.141.sh`, `99-port`-related helpers, and
`update-port-work.sh` belong to the earlier ports and are not part of this one.

## Privacy and support limits

The port keeps disabled telemetry and experiment defaults, endpoint
replacement, Open VSX, bundled AI provider SDK removal, and the AppImage process
lifetime fix. Automatic updates are disabled for this unofficial build.
The agent-host telemetry reporter keeps its provider-neutral events (inert while
telemetry is disabled). The Codex account fields, Copilot SKU fields and OTel turn
timing, whose modules are removed, are dropped. Static checks are not a
packet-capture audit. User-installed extensions have their own network behavior.
Other architectures, operating systems, server targets, and the complete upstream
test suites are not validated here. Dependency installation reports npm audit
findings, retained in the build logs; this port is not a dependency security audit.

## Rollback

Nothing outside this directory is changed by the build. To undo, stop this
version's build/test processes and move `versions/1.141.2` to Trash. The
installed AppImage, settings, extensions and earlier version directories are
not touched.
