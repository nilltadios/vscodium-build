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
  '# VSCodium 1.141.2 build result', '',
  `Built an unofficial Linux x64 AppImage from VS Code 1.141.2 and VSCodium be70704, local version \`${manifest.config.release_version}\`, with the local red branding and theme defaults. The renderer and mounted main process stayed alive during a normal launch, and the captured editor window was visually reviewed. The isolated test instance and its FUSE mount were removed afterward.`, '',
  `Artifact: [${path.basename(appimage)}](${appimage})`, '',
  `SHA-256: \`${manifest.artifact.sha256}\``, '',
  `Source commit: \`${manifest.sources.vscode_commit}\`. Provenance: [manifest](${appimage}.manifest.json).`, '',
  '| Check | Exit | Seconds | Evidence |',
  '| --- | ---: | ---: | --- |',
  ...stages.map(r => `| ${r.stage} | ${r.exit_code} | ${r.seconds.toFixed(3)} | [log](${r.log}) |`), '',
  `GUI evidence: [screenshot](${path.join(gui, 'screen.png')}), [runtime](${path.join(gui, 'runtime.txt')}), [cleanup](${path.join(gui, 'cleanup.txt')}), [visual review](${path.join(gui, 'visual-review.json')}).`, '',
  "The first full-build run stopped at fetch: the installed AppImage had moved to ~/AppImages/vscodium.appimage, so fetch.sh now hashes that path (overridable with INSTALLED_APPIMAGE). The second run compiled and typechecked successfully, then exited 1 at electron-version-test: that test exercised a .npmrc.bak fallback from the retired 1.139 port, which upstream VSCodium no longer needs. It now checks the .npmrc reader and that the packaged binary is the pinned Electron. The remaining stages ran on the same compiled output; no source changed after compilation and typecheck. The first gui-smoke attempt exited 1 because the test window was closed by hand before the 15-second process check; the repeated test passed.", '',
  "Port: upstream VSCodium be70704 patches (for VS Code 1.140.0) replace the earlier local ports. 10 of 57 patches had rejected hunks (64 hunks) on 1.141.2. Uniquely matching hunks were reapplied by port-rejects.mjs; SDK-only modules new in 1.141 were removed by prune-providers.mjs; the rest are in finalize-port-1.141.2*.mjs. All of these are exported as patches/rebased/user/zzzz-port-1.141.2.patch.", '',
  "The installed AppImage checksum and home-root inventory are unchanged. This candidate is not installed automatically. The 1.139, 1.140 and 1.141.0 builds, settings, and extensions are preserved.", '',
  'Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are retained in the dependency-install logs; this port does not include a dependency security audit.', '',
  'Reproduce and check with the commands in README.md. `scripts/verify-final.mjs` checks artifact/source/patch hashes and the saved GUI review/cleanup results. Remove this version directory after stopping its own build/test processes to undo the task. The original build and installed AppImage do not need restoring.', ''
];
fs.writeFileSync(path.join(project, 'STATUS.md'), lines.join('\n'));
console.log(path.join(project, 'STATUS.md'));
