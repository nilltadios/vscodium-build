# VSCodium 1.145.2 build result

All recorded checks passed. Unofficial Linux x64 AppImage from VS Code 1.145.2 and VSCodium ca7f7b4, local version `1.145.20001`. The GUI screenshot was reviewed and recorded.

Artifact: [VSCodium-local-1.145.20001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/dist/VSCodium-local-1.145.20001-x86_64.AppImage)

SHA-256: `a432799c508792d254f63f5151dee3ab31b71affdcb73b001a3a054eb89d418c`

Source commit: `c4453f8ea430795f941c1b2ff6c9321135a74a02`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/dist/VSCodium-local-1.145.20001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 289.042 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T144907393346065Z-editor-build.log) |
| telemetry-defaults | 0 | 0.459 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145356452848316Z-telemetry-defaults.log) |
| typecheck | 0 | 30.444 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145356933692137Z-typecheck.log) |
| electron-version-test | 0 | 3.174 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145427401004308Z-electron-version-test.log) |
| artifact-check | 0 | 0.749 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145430593004891Z-artifact-check.log) |
| appimage-package | 0 | 24.003 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145431357128736Z-appimage-package.log) |
| appimage-check | 0 | 0.533 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145455378387679Z-appimage-check.log) |
| manifest | 0 | 0.459 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145455924569894Z-manifest.log) |
| project-check | 0 | 4.953 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145456397784162Z-project-check.log) |
| gui-smoke | 0 | 42.243 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145501486974168Z-gui-smoke.log) |
| final-verification | 0 | 0.919 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145605057841244Z-final-verification.log) |
| all-test-cleanup | 0 | 2.021 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/logs/20261106T145606000487612Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/evidence/gui-20261106T145501495687876Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/evidence/gui-20261106T145501495687876Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/evidence/gui-20261106T145501495687876Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/evidence/gui-20261106T145501495687876Z/visual-review.json).

Port from 1.145.0: driven by scripts/port.sh (finalize-port-1.145.2.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-1.145.2.patch. Summary from evidence/port/report.md:

- Rebase of 1.145.0's patches: 0 rejected hunk(s); replay of the 1.145.0 port patch: 0.
- port-rejects.mjs: 0 applied, 0 unresolved, 0 missing-file.
- Three-way merge: 0 file(s), 0 conflict(s).
- Pruned provider modules: 0. Rules: 0 change(s).
- finalize-port-1.145.2.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.145.2/cache/port-deps/05071c61abb7226e.
- Typecheck: exit 0, 0 error(s).

The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.

Reproduce and check with the commands in README.md. To undo, stop this version's build/test processes and move the version directory to Trash.
