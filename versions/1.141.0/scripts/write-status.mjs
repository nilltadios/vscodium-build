import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const project = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(project, file), 'utf8');
const appimage = read('evidence/latest-appimage.txt').trim();
const manifest = JSON.parse(fs.readFileSync(appimage + '.manifest.json', 'utf8'));
const records = read('evidence/timings.jsonl').trim().split('\n').map(line => JSON.parse(line));
const names = ['editor-build', 'telemetry-defaults', 'typecheck', 'electron-version-test', 'artifact-check', 'appimage-package', 'appimage-check', 'manifest', 'project-check', 'gui-smoke', 'final-verification', 'all-test-cleanup'];
const stages = names.map(name => {
  const row = records.findLast(r => r.stage === name);
  assert.equal(row?.exit_code, 0, name);
  return row;
});
const gui = read('evidence/latest-gui.txt').trim();
const lines = [
  '# VSCodium 1.141.0 build result', '',
  `Built an unofficial Linux x64 AppImage from VS Code 1.141.0, local version \`${manifest.config.release_version}\`, with the local red branding and theme defaults. The renderer and mounted main process stayed alive during a normal launch, and the captured editor window was visually reviewed. The isolated test instance and its FUSE mount were removed afterward.`, '',
  `Artifact: [${path.basename(appimage)}](${appimage})`, '',
  `SHA-256: \`${manifest.artifact.sha256}\``, '',
  `Source commit: \`${manifest.sources.vscode_commit}\`. Provenance: [manifest](${appimage}.manifest.json).`, '',
  '| Check | Exit | Seconds | Evidence |',
  '| --- | ---: | ---: | --- |',
  ...stages.map(r => `| ${r.stage} | ${r.exit_code} | ${r.seconds.toFixed(3)} | [log](${r.log}) |`), '',
  `GUI evidence: [screenshot](${path.join(gui, 'screen.png')}), [runtime](${path.join(gui, 'runtime.txt')}), [cleanup](${path.join(gui, 'cleanup.txt')}), [visual review](${path.join(gui, 'visual-review.json')}).`, '',
  'The full build driver compiled and typechecked successfully, then exited 1 at the artifact check: packaging minifies extension manifests, and the check compared the bundled theme-defaults manifest byte for byte. It now compares JSON content (an altered manifest is still rejected). AppImage packaging then failed because appimagetool did not resolve the relative runtime path; the script now passes absolute paths. The remaining stages were run on the same compiled output; no source changed after compilation and typecheck.', '',
  'Port: 26 hunks were rejected from the 1.140 patch set. Uniquely matching hunks were reapplied by `port-rejects.mjs`; provider SDK modules new in 1.141 were removed by `prune-providers.mjs`; the rest are in `finalize-port-1.141*.mjs`. All of these are exported as `patches/rebased/user/zzzz-port-1.141.0.patch`. `sessionSandbox.test.ts` was removed because nearly all of its tests use the removed Copilot sandbox-policy module.', '',
  'The installed AppImage checksum and home-root inventory are unchanged. This candidate is not installed automatically. The 1.139 and 1.140 builds, settings, and extensions are preserved.', '',
  'Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are retained in the dependency-install logs; this port does not include a dependency security audit.', '',
  'Reproduce and check with the commands in README.md. `scripts/verify-final.mjs` checks artifact/source/patch hashes and the saved GUI review/cleanup results. Remove this version directory after stopping its own build/test processes to undo the task. The original build and installed AppImage do not need restoring.', ''
];
fs.writeFileSync(path.join(project, 'STATUS.md'), lines.join('\n'));
console.log(path.join(project, 'STATUS.md'));
