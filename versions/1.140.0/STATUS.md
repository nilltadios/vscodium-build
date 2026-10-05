# VSCodium 1.140.0 build result

Built an unofficial Linux x64 AppImage from VS Code 1.140.0, local version `1.140.00001`. The renderer and mounted main process stayed alive during a normal launch, and the captured editor window was visually reviewed. The isolated test instance and its FUSE mount were removed afterward.

Artifact: [VSCodium-local-1.140.00001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/dist/VSCodium-local-1.140.00001-x86_64.AppImage)

SHA-256: `c33ca37b83682814a366a77c8316a08ed38fbf7721d91e64cf858f1dc4095dfa`

Source commit: `07f806f999227108933c2e30515b26eecc1fda74`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/dist/VSCodium-local-1.140.00001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 246.022 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T105853416153948Z-editor-build.log) |
| telemetry-defaults | 0 | 0.430 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110259459408325Z-telemetry-defaults.log) |
| typecheck | 0 | 31.371 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110259911441308Z-typecheck.log) |
| electron-version-test | 0 | 5.571 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110331302275784Z-electron-version-test.log) |
| artifact-check | 0 | 0.554 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110336889511996Z-artifact-check.log) |
| appimage-package | 0 | 24.764 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110337457221160Z-appimage-package.log) |
| appimage-check | 0 | 0.479 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110402236672590Z-appimage-check.log) |
| manifest | 0 | 0.365 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110402728887557Z-manifest.log) |
| project-check-repaired | 0 | 1.163 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110918331345349Z-project-check-repaired.log) |
| gui-smoke | 0 | 43.208 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110642374300344Z-gui-smoke.log) |
| final-verification | 0 | 0.483 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110809803062283Z-final-verification.log) |
| all-test-cleanup | 0 | 3.876 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/logs/20261002T110914435321657Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/evidence/gui-20261002T110642383807447Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/evidence/gui-20261002T110642383807447Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/evidence/gui-20261002T110642383807447Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.140.0/evidence/gui-20261002T110642383807447Z/visual-review.json).

The last full build driver exited 1 after successful packaging because project verification encountered an empty checksum file left by the failed initial fetch. The empty file was retained with a `.failed-empty` suffix, the fetcher was fixed to write a checksum only after success, and project verification passed on retry. Earlier failed compilation/typecheck attempts and the explicitly stopped retry remain in the timing record. No compiled source or artifact changed after the successful final compilation and typecheck.

The first GUI test rendered correctly but its cleanup signaled both the editor and waiting CLI, producing exit 143. Cleanup now closes only the editor and allows the CLI to exit normally. The repeated GUI test exited 0, and both recorded test profiles and mounts are gone.

The installed AppImage checksum and home-root inventory are unchanged. This candidate is not installed automatically. The previous 1.139 build, settings, and extensions are preserved.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are retained in the dependency-install logs; this port does not include a dependency security audit.

Reproduce and check with the commands in README.md. `scripts/verify-final.mjs` checks artifact/source/patch hashes and the saved GUI review/cleanup results. Remove this version directory after stopping its own build/test processes to undo the task. The original build and installed AppImage do not need restoring.
