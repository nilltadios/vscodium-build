# VSCodium 1.144.0 build result

All recorded checks passed. Unofficial Linux x64 AppImage from VS Code 1.144.0 and VSCodium ca7f7b4, local version `1.144.00002`. The GUI screenshot was reviewed and recorded.

Artifact: [VSCodium-local-1.144.00002-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/dist/VSCodium-local-1.144.00002-x86_64.AppImage)

SHA-256: `e1595fa09e6df3dd89b415b997415ba76e5e5877f2e7a176433cbad1627e0a90`

Source commit: `2c33b50b16c472efe58357d1d2a8a5414bc23fbf`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/dist/VSCodium-local-1.144.00002-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 267.719 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123233903989524Z-editor-build.log) |
| telemetry-defaults | 0 | 0.485 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123701646075891Z-telemetry-defaults.log) |
| typecheck | 0 | 25.488 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123702151677407Z-typecheck.log) |
| electron-version-test | 0 | 3.559 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123727660343797Z-electron-version-test.log) |
| artifact-check | 0 | 0.557 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123731232052531Z-artifact-check.log) |
| appimage-package | 0 | 22.546 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123731802851843Z-appimage-package.log) |
| appimage-check | 0 | 0.487 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123754363240931Z-appimage-check.log) |
| manifest | 0 | 0.357 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123754862309322Z-manifest.log) |
| project-check | 0 | 5.572 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123755231933827Z-project-check.log) |
| gui-smoke | 0 | 44.288 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123800929535880Z-gui-smoke.log) |
| final-verification | 0 | 0.433 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123855947660371Z-final-verification.log) |
| all-test-cleanup | 0 | 2.348 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/logs/20261029T123856395943857Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/evidence/gui-20261029T123800938105130Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/evidence/gui-20261029T123800938105130Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/evidence/gui-20261029T123800938105130Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/evidence/gui-20261029T123800938105130Z/visual-review.json).

Port from 1.143.1: driven by scripts/port.sh (finalize-port-1.144.0.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-1.144.0.patch. Summary from evidence/port/report.md:

- Rebase of 1.143.1's patches: 49 rejected hunk(s); replay of the 1.143.1 port patch: 0.
- port-rejects.mjs: 36 applied, 15 unresolved, 0 missing-file.
- Three-way merge: 6 file(s), 11 conflict(s).
- package.json hunks left to port-rules.mjs and the lock refresh: 6.
- Pruned provider modules: 0. Rules: 4 change(s).
- finalize-port-1.144.0-ca7f7b4.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.144.0-vscodium-ca7f7b4/cache/port-deps/2da084c1649fd749.
- Typecheck: exit 0, 0 error(s).

The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.

Reproduce and check with the commands in README.md. To undo, stop this version's build/test processes and move the version directory to Trash.
