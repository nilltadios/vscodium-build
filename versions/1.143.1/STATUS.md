# VSCodium 1.143.1 build result

All recorded checks passed. Unofficial Linux x64 AppImage from VS Code 1.143.1 and VSCodium be70704, local version `1.143.10001`. The GUI screenshot was reviewed and recorded.

Artifact: [VSCodium-local-1.143.10001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/dist/VSCodium-local-1.143.10001-x86_64.AppImage)

SHA-256: `963dbfc3a22eb83e20f4fbea74783d361cbfff65364cbaf56bcff86b89dc9f04`

Source commit: `e646868227c3e3a9e3f24277c8c7220be42c0be7`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/dist/VSCodium-local-1.143.10001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 258.866 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030402661538223Z-editor-build.log) |
| telemetry-defaults | 0 | 0.544 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030821549333876Z-telemetry-defaults.log) |
| typecheck | 0 | 36.671 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030822113670801Z-typecheck.log) |
| electron-version-test | 0 | 5.001 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030858808449235Z-electron-version-test.log) |
| artifact-check | 0 | 0.558 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030903822454527Z-artifact-check.log) |
| appimage-package | 0 | 21.581 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030904393564832Z-appimage-package.log) |
| appimage-check | 0 | 0.453 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030925990261274Z-appimage-check.log) |
| manifest | 0 | 0.326 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030926455638164Z-manifest.log) |
| project-check | 0 | 5.523 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030926795237103Z-project-check.log) |
| gui-smoke | 0 | 42.672 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T030932471575266Z-gui-smoke.log) |
| final-verification | 0 | 0.459 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T031028128246430Z-final-verification.log) |
| all-test-cleanup | 0 | 2.126 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/logs/20261023T031028602205146Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/evidence/gui-20261023T030932481478817Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/evidence/gui-20261023T030932481478817Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/evidence/gui-20261023T030932481478817Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/evidence/gui-20261023T030932481478817Z/visual-review.json).

Port from 1.142.0: driven by scripts/port.sh (finalize-port-1.143.1.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-1.143.1.patch. Summary from evidence/port/report.md:

- Rebase of 1.142.0's patches: 33 rejected hunk(s); replay of the 1.142.0 port patch: 44.
- port-rejects.mjs: 44 applied, 54 unresolved, 0 missing-file.
- Three-way merge: 13 file(s), 55 conflict(s).
- package.json hunks left to port-rules.mjs and the lock refresh: 5.
- Pruned provider modules: 56. Rules: 3 change(s).
- finalize-port-1.143.1.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.143.1/cache/port-deps/de5c1e3146cb4fc2.
- Typecheck: exit 0, 0 error(s).

The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.

Reproduce and check with the commands in README.md. To undo, stop this version's build/test processes and move the version directory to Trash.
