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
  '# VSCodium 1.142.0 build result', '',
  `Built an unofficial Linux x64 AppImage from VS Code 1.142.0 and VSCodium be70704, local version \`${manifest.config.release_version}\`, with the local red branding and theme defaults. The renderer and mounted main process stayed alive during a normal launch, and the captured editor window was visually reviewed. The isolated test instance and its FUSE mount were removed afterward.`, '',
  `Artifact: [${path.basename(appimage)}](${appimage})`, '',
  `SHA-256: \`${manifest.artifact.sha256}\``, '',
  `Source commit: \`${manifest.sources.vscode_commit}\`. Provenance: [manifest](${appimage}.manifest.json).`, '',
  '| Check | Exit | Seconds | Evidence |',
  '| --- | ---: | ---: | --- |',
  ...stages.map(r => `| ${r.stage} | ${r.exit_code} | ${r.seconds.toFixed(3)} | [log](${r.log}) |`), '',
  `GUI evidence: [screenshot](${path.join(gui, 'screen.png')}), [runtime](${path.join(gui, 'runtime.txt')}), [cleanup](${path.join(gui, 'cleanup.txt')}), [visual review](${path.join(gui, 'visual-review.json')}).`, '',
  read('evidence/run-notes.md').trim(), '',
  "Port: the 1.141.2 patch set (upstream VSCodium be70704 patches plus its local port) was carried to 1.142.0. port-patches.sh rebased each patch with --reject, the 1.141.2 port patch was replayed, port-rejects.mjs reapplied uniquely matching hunks, merge-from-1.141.2.sh three-way merged the remaining files (13 files, 38 conflicts), prune-providers.mjs removed new SDK-importing modules, and finalize-port-1.142.0.mjs resolves each conflict explicitly. The result is exported as patches/rebased/user/zzzz-port-1.142.0.patch; port-1.142.0.sh reruns the whole sequence.", '',
  "The installed AppImage checksum and home-root inventory are unchanged. This candidate is not installed automatically. The 1.139, 1.140, 1.141.0 and 1.141.2 builds, settings, and extensions are preserved.", '',
  'Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are retained in the dependency-install logs; this port does not include a dependency security audit.', '',
  'Reproduce and check with the commands in README.md. `scripts/verify-final.mjs` checks artifact/source/patch hashes and the saved GUI review/cleanup results. Remove this version directory after stopping its own build/test processes to undo the task. The original build and installed AppImage do not need restoring.', ''
];
fs.writeFileSync(path.join(project, 'STATUS.md'), lines.join('\n'));
console.log(path.join(project, 'STATUS.md'));
