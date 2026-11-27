// Write STATUS.md for this workspace from config, the artifact manifest, timings, the GUI evidence and the port
// report. Version-agnostic replacement for the per-version write-status.mjs files.
import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(project, file), 'utf8');
const maybe = file => { try { return read(file); } catch { return ''; } };
const config = JSON.parse(read('config.json'));
const port = JSON.parse(maybe('port.json') || '{}');
const appimage = read('evidence/latest-appimage.txt').trim();
const manifest = JSON.parse(fs.readFileSync(appimage + '.manifest.json', 'utf8'));
const records = read('evidence/timings.jsonl').trim().split('\n').map(line => JSON.parse(line));
const names = ['editor-build', 'telemetry-defaults', 'typecheck', 'electron-version-test', 'artifact-check', 'appimage-package',
  'appimage-check', 'manifest', 'project-check', 'gui-smoke', 'final-verification', 'all-test-cleanup'];
const stages = names.map(name => records.findLast(r => r.stage === name)).filter(Boolean);
const gui = maybe('evidence/latest-gui.txt').trim();
const reviewed = gui && fs.existsSync(path.join(gui, 'visual-review.json'));
const failed = stages.filter(r => r.exit_code !== 0).map(r => r.stage);
const portReport = maybe('evidence/port/report.md').trim().split('\n');
const lines = [
  `# VSCodium ${config.vscode_version} build result`, '',
  `${failed.length ? `Not finished: ${failed.join(', ')} failed.` : 'All recorded checks passed.'} Unofficial Linux x64 AppImage from VS Code ${config.vscode_version} and VSCodium ${config.vscodium_commit.slice(0, 7)}, local version \`${manifest.config.release_version}\`.` +
    (reviewed ? ' The GUI screenshot was reviewed and recorded.' : ' The GUI screenshot has not been reviewed yet.'), '',
  `Artifact: [${path.basename(appimage)}](${appimage})`, '',
  `SHA-256: \`${manifest.artifact.sha256}\``, '',
  `Source commit: \`${manifest.sources.vscode_commit}\`. Provenance: [manifest](${appimage}.manifest.json).`, '',
  '| Check | Exit | Seconds | Evidence |', '| --- | ---: | ---: | --- |',
  ...stages.map(r => `| ${r.stage} | ${r.exit_code} | ${r.seconds.toFixed(3)} | [log](${r.log}) |`), '',
  ...(gui ? [`GUI evidence: [screenshot](${path.join(gui, 'screen.png')}), [runtime](${path.join(gui, 'runtime.txt')}), [cleanup](${path.join(gui, 'cleanup.txt')})` +
    (reviewed ? `, [visual review](${path.join(gui, 'visual-review.json')}).` : '.'), ''] : []),
  ...(maybe('evidence/run-notes.md').trim() ? [maybe('evidence/run-notes.md').trim(), ''] : []),
  ...(port.from ? [`Port from ${port.from}: driven by scripts/port.sh (finalize-port-${config.vscode_version}.mjs for this release's conflict picks, port-rules.mjs for recurring resolutions), exported as patches/rebased/user/zzzz-port-${config.vscode_version}.patch. Summary from evidence/port/report.md:`, '',
    ...portReport.filter(l => l.startsWith('- ')), ''] : []),
  'The build does not install the AppImage and leaves earlier version directories, settings and extensions unchanged; scripts/verify.sh checks the installed AppImage checksum and the home-root inventory.', '',
  'Checks cover compilation, full source typechecking, static telemetry defaults and product metadata, known endpoint strings, CLI architecture/version, and normal GUI startup on this Fedora host. The complete upstream test suites, a packet-capture audit, other operating systems/architectures, and server targets were not run. Npm audit findings are kept in the dependency-install logs; there is no dependency security audit.', '',
  'Reproduce and check with the commands in README.md. To undo, stop this version\'s build/test processes and move the version directory to Trash.', ''
];
fs.writeFileSync(path.join(project, 'STATUS.md'), lines.join('\n'));
console.log(path.join(project, 'STATUS.md'));
