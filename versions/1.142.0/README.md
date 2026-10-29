# VSCodium local build based on VS Code 1.142.0

Unofficial Linux x64 build, local version `1.142.00001`. This directory keeps
the 1.139, 1.140, 1.141.0 and 1.141.2 builds and the installed AppImage separate from
this candidate. Build and verification status are recorded in `STATUS.md` when
checks finish.

Run a fresh build from this directory:

```bash
bash scripts/timed.sh full-build-1.142.0 bash scripts/build.sh
```

Expected result: exit 0 and
`dist/VSCodium-local-1.142.00001-x86_64.AppImage`, with its SHA-256 and manifest.
The driver starts from pristine source, validates patch hashes, installs locked
dependencies, compiles, checks telemetry defaults, typechecks, packages, and
checks the AppImage. Exact commands, timestamps, exit statuses, and complete
logs are retained in `evidence/timings.jsonl` and `logs/`.

```bash
sha256sum -c dist/VSCodium-local-1.142.00001-x86_64.AppImage.sha256
bash scripts/check-appimage.sh dist/VSCodium-local-1.142.00001-x86_64.AppImage
bash scripts/verify.sh
node scripts/verify-final.mjs
bash scripts/check-test-cleanup.sh
```

Expected result for each check: exit 0. The version command reports
`1.142.00001` and `x64`. Its middle line is VSCodium's synthetic release commit;
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
Sources and caches were copied using filesystem reflinks from `versions/1.141.2`.

Source pins:

- VS Code `d956e8a6ac5d904486557eea07e1d6bd62a4d36f`, tag `1.142.0`.
- VSCodium build scripts and patches `be70704abf84fc6c7721f94478dfcccd2dc6163e`
  (upstream release `1.140.06880`, whose patches target VS Code 1.140.0).

Source URLs and fetch commands are in `scripts/fetch.sh` and
`evidence/fetch-sources.tsv`. Upstream release:
https://github.com/microsoft/vscode/releases/tag/1.142.0

`scripts/fetch.sh` records the checksum of the installed AppImage, now
`~/AppImages/vscodium.appimage` (override with `INSTALLED_APPIMAGE=`), so
`verify.sh` can show the build left it unchanged.

## Port

1.142.0 carries the 1.141.2 patch set forward (VSCodium `be70704` patches, the
local `user/100-appimage-process-lifetime.patch`, and the 1.141.2 port, kept for
reference in `evidence/patches-1.141.2-reference/`). Applied unchanged, 17 of 59
patches fail on 1.142.0. `scripts/port-1.142.0.sh` rebuilds the port from scratch
and can be rerun:

1. Restore `patches/rebased/` from the 1.141.2 reference (minus its port patch),
   `prepare-work.sh`, then `port-patches.sh` (rebase with `--reject`; 36 hunks
   rejected, kept in `evidence/rejects/`).
2. `replay-port-1.141.2.sh`: apply the 1.141.2 port patch with `--reject`
   (rejects in `evidence/rejects-port-1.141.2/`).
3. `port-rejects.mjs` on both reject sets: reapply uniquely matching hunks.
4. `merge-from-1.141.2.sh`: three-way merge of the 13 files still unresolved
   (`evidence/merge-files.txt`; ours = 1.141.2 patched tree, base = 1.141.2,
   theirs = 1.142.0), leaving 38 conflicts (copies in `evidence/merge-conflicted/`).
   This needs `versions/1.141.2` with its work tree present.
5. `prune-providers.mjs`: remove new modules importing the Copilot/Claude/Codex SDKs.
6. `finalize-port-1.142.0.mjs`: resolve each conflict explicitly, with reasons.
7. `refresh-locks.sh` in the builder container.

Then `export-port-1.142.0.sh` writes `user/zzzz-port-1.142.0.patch` and refreshes
`evidence/port-patches.sha256`. Check: `bash scripts/prepare-work.sh && bash
scripts/check-patches.sh` reports 59 applied, 0 failed. The resulting tree matches the
ported tree (`diff -rq` excluding `.git` and dependencies), apart from one empty
directory left by pruning, which git does not track.

Notable resolutions:

- Session titles stay deterministic, as in 1.141.2: 1.142 sends title
  generation through a new utility-model service on the Copilot API, and that path
  is not restored.
- The agent-host OTel service imports `@github/copilot-sdk` and stays removed. Its
  1.142 call sites (diagnostics bridge, turn timing, `isOtelEnabled`) are
  disabled or set to `false`. Codex account telemetry fields are dropped, as before.
- `@vscode/policy-watcher` was bumped upstream to ^1.6.0 with no source change.
  VSCodium's fork `@vscodium/policy-watcher@1.4.0-265896` is kept.
- The new MCP Servers view (1.142 links to the Customizations marketplace) keeps
  the hide-when-AI-features-are-disabled condition. The 1.142 "connected" tab heights
  are added to the custom-font tab sizes.
- 1.142 adds runtime dependencies `@hpke/core` and `libsodium-wrappers` (mission
  control authentication). They are kept.

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
version's build/test processes and move `versions/1.142.0` to Trash. The
installed AppImage, settings, extensions and earlier version directories are
not touched.
