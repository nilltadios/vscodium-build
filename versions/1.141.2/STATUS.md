# VSCodium 1.141.2 build result

Built an unofficial Linux x64 AppImage from VS Code 1.141.2 and VSCodium be70704, local version `1.141.20001`, with the local red branding and theme defaults. The renderer and mounted main process stayed alive during a normal launch, and the captured editor window was visually reviewed. The isolated test instance and its FUSE mount were removed afterward.

Artifact: [VSCodium-local-1.141.20001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/dist/VSCodium-local-1.141.20001-x86_64.AppImage)

SHA-256: `defbc8361dd4199c1ed7b3cff5499e2e3dff024ad22815f8c2d15a872f031567`

Source commit: `16507d91be0dc1ce4f94c04d4d0430210b8685d9`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/dist/VSCodium-local-1.141.20001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 266.273 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T150547675677289Z-editor-build.log) |
| telemetry-defaults | 0 | 0.409 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151013969693359Z-telemetry-defaults.log) |
| typecheck | 0 | 32.178 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151014396755016Z-typecheck.log) |
| electron-version-test | 0 | 1.220 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151124438947509Z-electron-version-test.log) |
| artifact-check | 0 | 0.581 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151129794166575Z-artifact-check.log) |
| appimage-package | 0 | 23.387 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151130389889166Z-appimage-package.log) |
| appimage-check | 0 | 0.446 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151153791744550Z-appimage-check.log) |
| manifest | 0 | 0.325 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151154251142871Z-manifest.log) |
| project-check | 0 | 4.936 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151154589919418Z-project-check.log) |
| gui-smoke | 0 | 43.084 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151329150645006Z-gui-smoke.log) |
| final-verification | 0 | 0.523 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151421999745957Z-final-verification.log) |
| all-test-cleanup | 0 | 3.890 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/logs/20261014T151422539132569Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/evidence/gui-20261014T151329160005282Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/evidence/gui-20261014T151329160005282Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/evidence/gui-20261014T151329160005282Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.2/evidence/gui-20261014T151329160005282Z/visual-review.json).

The first full-build run stopped at fetch: the installed AppImage had moved to ~/AppImages/vscodium.appimage, so fetch.sh now hashes that path (overridable with INSTALLED_APPIMAGE). The second run compiled and typechecked successfully, then exited 1 at electron-version-test: that test exercised a .npmrc.bak fallback from the retired 1.139 port, which upstream VSCodium no longer needs. It now checks the .npmrc reader and that the packaged binary is the pinned Electron. The remaining stages ran on the same compiled output; no source changed after compilation and typecheck. The first gui-smoke attempt exited 1 because the test window was closed by hand before the 15-second process check; the repeated test passed.

Port: upstream VSCodium be70704 patches (for VS Code 1.140.0) replace the earlier local ports. 10 of 57 patches had rejected hunks (64 hunks) on 1.141.2. Uniquely matching hunks were reapplied by port-rejects.mjs; SDK-only modules new in 1.141 were removed by prune-providers.mjs; the rest are in finalize-port-1.141.2*.mjs. All of these are exported as patches/rebased/user/zzzz-port-1.141.2.patch.

The installed AppImage checksum and home-root inventory are unchanged. This candidate is not installed automatically. The 1.139, 1.140 and 1.141.0 builds, settings, and extensions are preserved.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are retained in the dependency-install logs; this port does not include a dependency security audit.

Reproduce and check with the commands in README.md. `scripts/verify-final.mjs` checks artifact/source/patch hashes and the saved GUI review/cleanup results. Remove this version directory after stopping its own build/test processes to undo the task. The original build and installed AppImage do not need restoring.
