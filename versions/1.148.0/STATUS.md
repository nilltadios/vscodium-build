# VSCodium 1.148.0 build result

All recorded checks passed. Unofficial Linux x64 AppImage from VS Code 1.148.0 and VSCodium ca7f7b4, local version `1.148.00001`. The GUI screenshot was reviewed and recorded.

Artifact: [VSCodium-local-1.148.00001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/dist/VSCodium-local-1.148.00001-x86_64.AppImage)

SHA-256: `50faf42104bd2b72be435dba96b1a6b074f8577e0f7206aeb004be5ced939235`

Source commit: `661626d0e72f97806550790a98fb87116c9db825`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/dist/VSCodium-local-1.148.00001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 242.488 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201419034247783Z-editor-build.log) |
| telemetry-defaults | 0 | 0.520 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201821548619166Z-telemetry-defaults.log) |
| typecheck | 0 | 16.228 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201822103441476Z-typecheck.log) |
| electron-version-test | 0 | 3.981 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201838353348489Z-electron-version-test.log) |
| artifact-check | 0 | 0.625 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201842348650409Z-artifact-check.log) |
| appimage-package | 0 | 23.493 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201842989121043Z-appimage-package.log) |
| appimage-check | 0 | 0.483 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201906501192141Z-appimage-check.log) |
| manifest | 0 | 0.352 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201906997550523Z-manifest.log) |
| project-check | 0 | 5.856 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201907367828150Z-project-check.log) |
| gui-smoke | 0 | 43.969 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T201913405793707Z-gui-smoke.log) |
| final-verification | 0 | 0.496 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T202026436116164Z-final-verification.log) |
| all-test-cleanup | 0 | 2.598 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/logs/20261127T202026950857748Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/evidence/gui-20261127T201913419495026Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/evidence/gui-20261127T201913419495026Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/evidence/gui-20261127T201913419495026Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/evidence/gui-20261127T201913419495026Z/visual-review.json).

Port from 1.147.0: driven by scripts/port.sh (finalize-port-1.148.0.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-1.148.0.patch. Summary from evidence/port/report.md:

- Rebase of 1.147.0's patches: 34 rejected hunk(s); replay of the 1.147.0 port patch: 27.
- port-rejects.mjs: 54 applied, 42 unresolved, 0 missing-file.
- Three-way merge: 17 file(s), 39 conflict(s).
- package.json hunks left to port-rules.mjs and the lock refresh: 5.
- Pruned provider modules: 12. Rules: 3 change(s).
- finalize-port-1.148.0.mjs: ok.
- Dependencies: /home/nilllinux22/Documents/VSCodium-Build/versions/1.148.0/cache/port-deps/7612fcfc6cf45c13.
- Typecheck: exit 0, 0 error(s).

The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.

Reproduce and check with the commands in README.md. To undo, stop this version's build/test processes and move the version directory to Trash.
