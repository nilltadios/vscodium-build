# VSCodium 1.144.0 build result

All recorded checks passed. Unofficial Linux x64 AppImage from VS Code 1.144.0 and VSCodium be70704, local version `1.144.00001`. The GUI screenshot was reviewed and recorded.

Artifact: [VSCodium-local-1.144.00001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/dist/VSCodium-local-1.144.00001-x86_64.AppImage)

SHA-256: `90995b759a60b7d2a15c0a1ad7f4e66a9ce39b95d920c2b78865cdc29cc56185`

Source commit: `2c33b50b16c472efe58357d1d2a8a5414bc23fbf`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/dist/VSCodium-local-1.144.00001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 242.282 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T120850044655332Z-editor-build.log) |
| telemetry-defaults | 0 | 0.445 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121252342372434Z-telemetry-defaults.log) |
| typecheck | 0 | 45.402 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121252805506939Z-typecheck.log) |
| electron-version-test | 0 | 6.782 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121338227304673Z-electron-version-test.log) |
| artifact-check | 0 | 0.555 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121345022056328Z-artifact-check.log) |
| appimage-package | 0 | 22.233 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121345591006644Z-appimage-package.log) |
| appimage-check | 0 | 0.459 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121407839497418Z-appimage-check.log) |
| manifest | 0 | 0.332 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121408312049900Z-manifest.log) |
| project-check | 0 | 6.076 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121408658653704Z-project-check.log) |
| gui-smoke | 0 | 42.824 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121414867750920Z-gui-smoke.log) |
| final-verification | 0 | 0.353 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121510334928968Z-final-verification.log) |
| all-test-cleanup | 0 | 1.848 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/logs/20261029T121510701281666Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/evidence/gui-20261029T121414876820166Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/evidence/gui-20261029T121414876820166Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/evidence/gui-20261029T121414876820166Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/evidence/gui-20261029T121414876820166Z/visual-review.json).

Port from 1.143.1: driven by scripts/port.sh (finalize-port-1.144.0.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-1.144.0.patch. Summary from evidence/port/report.md:

- Rebase of 1.143.1's patches: 16 rejected hunk(s); replay of the 1.143.1 port patch: 34.
- port-rejects.mjs: 26 applied, 18 unresolved, 0 missing-file.
- Three-way merge: 8 file(s), 12 conflict(s).
- package.json hunks left to port-rules.mjs and the lock refresh: 6.
- Pruned provider modules: 34. Rules: 5 change(s).
- finalize-port-1.144.0.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0/cache/port-deps/6313fe35f32fbfa7.
- Typecheck: exit 0, 0 error(s).

The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.

Reproduce and check with the commands in README.md. To undo, stop this version's build/test processes and move the version directory to Trash.
