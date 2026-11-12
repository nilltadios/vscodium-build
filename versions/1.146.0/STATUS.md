# VSCodium 1.146.0 build result

All recorded checks passed. Unofficial Linux x64 AppImage from VS Code 1.146.0 and VSCodium ca7f7b4, local version `1.146.00001`. The GUI screenshot was reviewed and recorded.

Artifact: [VSCodium-local-1.146.00001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/dist/VSCodium-local-1.146.00001-x86_64.AppImage)

SHA-256: `1e5ee0ef8fe29ca08e2d257ad5b4ef39ecd717fbf91b60381f7e331b90e94ac6`

Source commit: `69047191fc427f2f92828279aae1d90d8eeda7ab`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/dist/VSCodium-local-1.146.00001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 243.560 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T031829807456235Z-editor-build.log) |
| telemetry-defaults | 0 | 0.460 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032233389194800Z-telemetry-defaults.log) |
| typecheck | 0 | 32.708 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032233886888679Z-typecheck.log) |
| electron-version-test | 0 | 4.413 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032306618093311Z-electron-version-test.log) |
| artifact-check | 0 | 0.606 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032311045983868Z-artifact-check.log) |
| appimage-package | 0 | 23.586 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032311666752323Z-appimage-package.log) |
| appimage-check | 0 | 0.490 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032335270526133Z-appimage-check.log) |
| manifest | 0 | 0.391 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032335774472895Z-manifest.log) |
| project-check | 0 | 5.692 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032336184500267Z-project-check.log) |
| gui-smoke | 0 | 44.485 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T032704277904031Z-gui-smoke.log) |
| final-verification | 0 | 0.501 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T034038321651724Z-final-verification.log) |
| all-test-cleanup | 0 | 5.748 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/logs/20261112T034038837691590Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/evidence/gui-20261112T032704287680015Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/evidence/gui-20261112T032704287680015Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/evidence/gui-20261112T032704287680015Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/evidence/gui-20261112T032704287680015Z/visual-review.json).

Port from 1.145.2: driven by scripts/port.sh (finalize-port-1.146.0.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-1.146.0.patch. Summary from evidence/port/report.md:

- Rebase of 1.145.2's patches: 32 rejected hunk(s); replay of the 1.145.2 port patch: 13.
- port-rejects.mjs: 45 applied, 24 unresolved, 0 missing-file.
- Three-way merge: 13 file(s), 18 conflict(s).
- package.json hunks left to port-rules.mjs and the lock refresh: 8.
- Pruned provider modules: 9. Rules: 4 change(s).
- finalize-port-1.146.0.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.146.0/cache/port-deps/bdb1e79bc1dbc4f1.
- Typecheck: exit 0, 0 error(s).

The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.

Reproduce and check with the commands in README.md. To undo, stop this version's build/test processes and move the version directory to Trash.
