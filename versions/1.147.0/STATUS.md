# VSCodium 1.147.0 build result

All recorded checks passed. Unofficial Linux x64 AppImage from VS Code 1.147.0 and VSCodium ca7f7b4, local version `1.147.00001`. The GUI screenshot was reviewed and recorded.

Artifact: [VSCodium-local-1.147.00001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/dist/VSCodium-local-1.147.00001-x86_64.AppImage)

SHA-256: `e40587ecff9b67acc214e238831c1521959bc6a72ec44da41bcb26a594c6b621`

Source commit: `8a14f0cc1b08d531eb83255ea3764ae22aa932b5`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/dist/VSCodium-local-1.147.00001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 258.378 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015339275807101Z-editor-build.log) |
| telemetry-defaults | 0 | 0.529 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015757685658028Z-telemetry-defaults.log) |
| typecheck | 0 | 24.493 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015758255730115Z-typecheck.log) |
| electron-version-test | 0 | 6.357 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015822801741839Z-electron-version-test.log) |
| artifact-check | 0 | 0.951 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015829186884898Z-artifact-check.log) |
| appimage-package | 0 | 28.831 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015830159729294Z-appimage-package.log) |
| appimage-check | 0 | 0.590 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015859017111471Z-appimage-check.log) |
| manifest | 0 | 0.518 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015859624840468Z-manifest.log) |
| project-check | 0 | 6.595 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015900164118857Z-project-check.log) |
| gui-smoke | 0 | 44.862 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T015906951332901Z-gui-smoke.log) |
| final-verification | 0 | 0.596 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T020023251340120Z-final-verification.log) |
| all-test-cleanup | 0 | 2.340 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/logs/20261119T020023867556125Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/evidence/gui-20261119T015906966635743Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/evidence/gui-20261119T015906966635743Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/evidence/gui-20261119T015906966635743Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/evidence/gui-20261119T015906966635743Z/visual-review.json).

Port from 1.146.0: driven by scripts/port.sh (finalize-port-1.147.0.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-1.147.0.patch. Summary from evidence/port/report.md:

- Rebase of 1.146.0's patches: 19 rejected hunk(s); replay of the 1.146.0 port patch: 23.
- port-rejects.mjs: 53 applied, 20 unresolved, 0 missing-file.
- Three-way merge: 13 file(s), 16 conflict(s).
- package.json hunks left to port-rules.mjs and the lock refresh: 5.
- Pruned provider modules: 2. Rules: 7 change(s).
- finalize-port-1.147.0.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.147.0/cache/port-deps/1f15e47742c345c9.
- Typecheck: exit 0, 0 error(s).

The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.

Reproduce and check with the commands in README.md. To undo, stop this version's build/test processes and move the version directory to Trash.
