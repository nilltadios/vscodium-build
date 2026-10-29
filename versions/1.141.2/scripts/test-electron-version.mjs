import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
// VSCodium be70704 no longer swaps .npmrc during installs, so the old .npmrc.bak fallback is gone.
// Check the Electron metadata reader and that the built app uses the pinned Electron.
const source = path.resolve(process.argv[2]);
const project = path.resolve(import.meta.dirname, '..');
const fixture = fs.mkdtempSync(path.join(project, 'work/electron-version-test-'));
fs.mkdirSync(path.join(fixture, 'build/lib'), { recursive: true });
fs.copyFileSync(path.join(source, 'build/lib/electronVersion.ts'), path.join(fixture, 'build/lib/electronVersion.ts'));
const { getElectronVersion } = await import(pathToFileURL(path.join(fixture, 'build/lib/electronVersion.ts')));
const npmrc = fs.readFileSync(path.join(source, '.npmrc'), 'utf8');
const pinned = { electronVersion: /^target="(.*)"$/m.exec(npmrc)[1], msBuildId: /^ms_build_id="(.*)"$/m.exec(npmrc)[1] };
test('Electron metadata is read from .npmrc and honours VSCODE_ELECTRON_VERSION', () => {
  fs.writeFileSync(path.join(fixture, '.npmrc'), npmrc);
  assert.deepEqual(getElectronVersion(), pinned);
  const previous = process.env.VSCODE_ELECTRON_VERSION;
  process.env.VSCODE_ELECTRON_VERSION = '0.0.1';
  try {
    assert.deepEqual(getElectronVersion(), { ...pinned, electronVersion: '0.0.1' });
  } finally {
    if (previous === undefined) delete process.env.VSCODE_ELECTRON_VERSION;
    else process.env.VSCODE_ELECTRON_VERSION = previous;
  }
});
test('packaged Electron matches the pinned target', () => {
  const app = path.join(path.dirname(source), 'VSCode-linux-x64');
  const binary = fs.readFileSync(path.join(app, 'codium')).toString('latin1');
  assert.deepEqual([...new Set(binary.match(/Electron\/\d+\.\d+\.\d+/g))], [`Electron/${pinned.electronVersion}`]);
});
