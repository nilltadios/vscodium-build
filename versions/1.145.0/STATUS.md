# VSCodium 1.145.0 build result

All recorded checks passed. Unofficial Linux x64 AppImage from VS Code 1.145.0 and VSCodium ca7f7b4, local version `1.145.00001`. The GUI screenshot was reviewed and recorded.

Artifact: [VSCodium-local-1.145.00001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/dist/VSCodium-local-1.145.00001-x86_64.AppImage)

SHA-256: `833615c3f25234bebf26b9cbefe582ee7a3bf6f5b11d588b50f800c0590e010f`

Source commit: `a717861c07586a53d83b80d742cd3f59b20a6273`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/dist/VSCodium-local-1.145.00001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 351.226 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163117727268492Z-editor-build.log) |
| telemetry-defaults | 0 | 0.616 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163708984894586Z-telemetry-defaults.log) |
| typecheck | 0 | 40.303 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163709629733594Z-typecheck.log) |
| electron-version-test | 0 | 5.368 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163749964038747Z-electron-version-test.log) |
| artifact-check | 0 | 0.973 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163755357573849Z-artifact-check.log) |
| appimage-package | 0 | 34.528 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163756353369438Z-appimage-package.log) |
| appimage-check | 0 | 0.671 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163830901655877Z-appimage-check.log) |
| manifest | 0 | 0.490 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163831592984208Z-manifest.log) |
| project-check | 0 | 7.399 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163832102355755Z-project-check.log) |
| gui-smoke | 0 | 44.945 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163839804725248Z-gui-smoke.log) |
| final-verification | 0 | 0.516 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163942289985104Z-final-verification.log) |
| all-test-cleanup | 0 | 2.593 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/logs/20261104T163942825773963Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/evidence/gui-20261104T163839820301737Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/evidence/gui-20261104T163839820301737Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/evidence/gui-20261104T163839820301737Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/evidence/gui-20261104T163839820301737Z/visual-review.json).

Port from 1.144.0: driven by scripts/port.sh (finalize-port-1.145.0.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-1.145.0.patch. Summary from evidence/port/report.md:

- Rebase of 1.144.0's patches: 30 rejected hunk(s); replay of the 1.144.0 port patch: 15.
- port-rejects.mjs: 38 applied, 18 unresolved, 0 missing-file.
- Three-way merge: 8 file(s), 15 conflict(s).
- package.json hunks left to port-rules.mjs and the lock refresh: 6.
- Pruned provider modules: 3. Rules: 3 change(s).
- finalize-port-1.145.0.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.145.0/cache/port-deps/c9837ae0a0616abf.
- Typecheck: exit 0, 0 error(s).

The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.

Reproduce and check with the commands in README.md. To undo, stop this version's build/test processes and move the version directory to Trash.
