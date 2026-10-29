import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
const source = path.resolve(process.argv[2]);
const project = path.resolve(import.meta.dirname, '..');
const fixture = fs.mkdtempSync(path.join(project, 'work/electron-version-test-'));
fs.mkdirSync(path.join(fixture, 'build/lib'), { recursive: true });
fs.copyFileSync(path.join(source, 'build/lib/electronVersion.ts'), path.join(fixture, 'build/lib/electronVersion.ts'));
const { getElectronVersion } = await import(pathToFileURL(path.join(fixture, 'build/lib/electronVersion.ts')));
test('Electron metadata survives VSCodium host-Node npmrc replacement', () => {
  fs.writeFileSync(path.join(fixture, '.npmrc'), 'target="43.6.0"\nms_build_id="15274685"\n');
  assert.deepEqual(getElectronVersion(), { electronVersion: '43.6.0', msBuildId: '15274685' });
  fs.renameSync(path.join(fixture, '.npmrc'), path.join(fixture, '.npmrc.bak'));
  fs.writeFileSync(path.join(fixture, '.npmrc'), 'build_from_source="true"\n');
  assert.deepEqual(getElectronVersion(), { electronVersion: '43.6.0', msBuildId: '15274685' });
  const previous = process.env.VSCODE_ELECTRON_VERSION;
  process.env.VSCODE_ELECTRON_VERSION = '43.6.1';
  try {
    assert.deepEqual(getElectronVersion(), { electronVersion: '43.6.1', msBuildId: '15274685' });
  } finally {
    if (previous === undefined) delete process.env.VSCODE_ELECTRON_VERSION;
    else process.env.VSCODE_ELECTRON_VERSION = previous;
  }
});
