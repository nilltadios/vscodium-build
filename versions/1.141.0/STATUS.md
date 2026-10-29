# VSCodium 1.141.0 build result

Built an unofficial Linux x64 AppImage from VS Code 1.141.0, local version `1.141.00001`, with the local red branding and theme defaults. The renderer and mounted main process stayed alive during a normal launch, and the captured editor window was visually reviewed. The isolated test instance and its FUSE mount were removed afterward.

Artifact: [VSCodium-local-1.141.00001-x86_64.AppImage](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/dist/VSCodium-local-1.141.00001-x86_64.AppImage)

SHA-256: `a553b965c046c636ceffcc0efa89f9688c988fbb2d6f599d45661b927fbf0b7c`

Source commit: `2a59476c9bfcb90b3ddc372c36762471b7dfad1c`. Provenance: [manifest](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/dist/VSCodium-local-1.141.00001-x86_64.AppImage.manifest.json).

| Check | Exit | Seconds | Evidence |
| --- | ---: | ---: | --- |
| editor-build | 0 | 246.123 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T003811732530854Z-editor-build.log) |
| telemetry-defaults | 0 | 0.482 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004217874696713Z-telemetry-defaults.log) |
| typecheck | 0 | 29.989 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004218376122178Z-typecheck.log) |
| electron-version-test | 0 | 2.201 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004248387887541Z-electron-version-test.log) |
| artifact-check | 0 | 0.657 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004315867199040Z-artifact-check.log) |
| appimage-package | 0 | 26.209 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004342577048549Z-appimage-package.log) |
| appimage-check | 0 | 0.476 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004408800608172Z-appimage-check.log) |
| manifest | 0 | 0.377 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004409289496912Z-manifest.log) |
| project-check | 0 | 5.011 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004409678440868Z-project-check.log) |
| gui-smoke | 0 | 43.712 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004424900513408Z-gui-smoke.log) |
| final-verification | 0 | 0.491 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004531625462918Z-final-verification.log) |
| all-test-cleanup | 0 | 1.803 | [log](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/logs/20261008T004532131943461Z-all-test-cleanup.log) |

GUI evidence: [screenshot](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/evidence/gui-20261008T004424910077673Z/screen.png), [runtime](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/evidence/gui-20261008T004424910077673Z/runtime.txt), [cleanup](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/evidence/gui-20261008T004424910077673Z/cleanup.txt), [visual review](/home/nilllinux22/Documents/VSCodium-Build/versions/1.141.0/evidence/gui-20261008T004424910077673Z/visual-review.json).

The full build driver compiled and typechecked successfully, then exited 1 at the artifact check: packaging minifies extension manifests, and the check compared the bundled theme-defaults manifest byte for byte. It now compares JSON content (an altered manifest is still rejected). AppImage packaging then failed because appimagetool did not resolve the relative runtime path; the script now passes absolute paths. The remaining stages were run on the same compiled output; no source changed after compilation and typecheck.

Port: 26 hunks were rejected from the 1.140 patch set. Uniquely matching hunks were reapplied by `port-rejects.mjs`; provider SDK modules new in 1.141 were removed by `prune-providers.mjs`; the rest are in `finalize-port-1.141*.mjs`. All of these are exported as `patches/rebased/user/zzzz-port-1.141.0.patch`. `sessionSandbox.test.ts` was removed because nearly all of its tests use the removed Copilot sandbox-policy module.

The installed AppImage checksum and home-root inventory are unchanged. This candidate is not installed automatically. The 1.139 and 1.140 builds, settings, and extensions are preserved.

Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are retained in the dependency-install logs; this port does not include a dependency security audit.

Reproduce and check with the commands in README.md. `scripts/verify-final.mjs` checks artifact/source/patch hashes and the saved GUI review/cleanup results. Remove this version directory after stopping its own build/test processes to undo the task. The original build and installed AppImage do not need restoring.
