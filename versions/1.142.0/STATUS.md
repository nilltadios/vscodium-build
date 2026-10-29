# VSCodium 1.142.0 build result

Built an unofficial Linux x64 AppImage from VS Code 1.142.0 and VSCodium be70704, local version `1.142.00001`, with the local red branding and theme defaults. The renderer and mounted main process stayed alive during a normal launch, and the captured editor window was visually reviewed. The isolated test instance and its FUSE mount were removed afterward.

Artifact: [VSCodium-local-1.142.00001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/dist/VSCodium-local-1.142.00001-x86_64.AppImage)

SHA-256: `d622b33c3cd30e6eed63568a445f116d1efe663fd29884e35c8f6b3b14e4c0e4`

Source commit: `d956e8a6ac5d904486557eea07e1d6bd62a4d36f`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/dist/VSCodium-local-1.142.00001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 241.658 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183342307772527Z-editor-build.log) |
| telemetry-defaults | 0 | 0.562 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183743987972716Z-telemetry-defaults.log) |
| typecheck | 0 | 31.842 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183744570071470Z-typecheck.log) |
| electron-version-test | 0 | 5.322 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183816432162997Z-electron-version-test.log) |
| artifact-check | 0 | 0.623 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183821769970214Z-artifact-check.log) |
| appimage-package | 0 | 21.923 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183822407107560Z-appimage-package.log) |
| appimage-check | 0 | 0.529 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183844344501005Z-appimage-check.log) |
| manifest | 0 | 0.428 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183844888448070Z-manifest.log) |
| project-check | 0 | 5.533 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183845331069643Z-project-check.log) |
| gui-smoke | 0 | 43.712 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T183907873831786Z-gui-smoke.log) |
| final-verification | 0 | 0.320 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T184005155943830Z-final-verification.log) |
| all-test-cleanup | 0 | 1.962 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/logs/20261016T184005489173033Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/evidence/gui-20261016T183907883687012Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/evidence/gui-20261016T183907883687012Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/evidence/gui-20261016T183907883687012Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.142.0/evidence/gui-20261016T183907883687012Z/visual-review.json).

The first full-build run of the ported tree passed every stage (fetch through project-check) and the GUI smoke test passed on its first attempt. During porting, check-patches with the unchanged 1.141.2 patch set failed (42 applied, 17 failed, including the 1.141.2 port patch); that is why the port was redone. New 1.142 runtime dependencies `@hpke/core` and `libsodium-wrappers` were absent from the 1.141.2 dependency tree used for the quick porting typecheck (typecheck-port); the full typecheck in the build, with 1.142 dependencies installed, exited 0.

Port: the 1.141.2 patch set (upstream VSCodium be70704 patches plus its local port) was carried to 1.142.0. port-patches.sh rebased each patch with --reject, the 1.141.2 port patch was replayed, port-rejects.mjs reapplied uniquely matching hunks, merge-from-1.141.2.sh three-way merged the remaining files (13 files, 38 conflicts), prune-providers.mjs removed new SDK-importing modules, and finalize-port-1.142.0.mjs resolves each conflict explicitly. The result is exported as patches/rebased/user/zzzz-port-1.142.0.patch; port-1.142.0.sh reruns the whole sequence.

The installed AppImage checksum and home-root inventory are unchanged. This candidate is not installed automatically. The 1.139, 1.140, 1.141.0 and 1.141.2 builds, settings, and extensions are preserved.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are retained in the dependency-install logs; this port does not include a dependency security audit.

Reproduce and check with the commands in README.md. `scripts/verify-final.mjs` checks artifact/source/patch hashes and the saved GUI review/cleanup results. Remove this version directory after stopping its own build/test processes to undo the task. The original build and installed AppImage do not need restoring.
