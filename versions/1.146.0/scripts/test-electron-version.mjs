import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
// Check the Electron metadata reader and that the built app uses the pinned Electron. VS Code 1.146+ reads the
// target from package.json `nativeBuild` (build/npm/pnpm/nativeBuildEnv.ts); older trees from .npmrc.
const source = path.resolve(process.argv[2]);
const project = path.resolve(import.meta.dirname, '..');
const fixture = fs.mkdtempSync(path.join(project, 'work/electron-version-test-'));
const copy = file => {
  fs.mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true });
  fs.copyFileSync(path.join(source, file), path.join(fixture, file));
};
const pnpm = fs.existsSync(path.join(source, 'build/npm/pnpm/nativeBuildEnv.ts'));
copy('build/lib/electronVersion.ts');
if (pnpm) copy('build/npm/pnpm/nativeBuildEnv.ts');
const { getElectronVersion } = await import(pathToFileURL(path.join(fixture, 'build/lib/electronVersion.ts')));
const metadata = pnpm ? 'package.json' : '.npmrc';
const text = fs.readFileSync(path.join(source, metadata), 'utf8');
const nativeBuild = pnpm ? JSON.parse(text).nativeBuild : undefined;
const pinned = pnpm
  ? { electronVersion: nativeBuild.target, msBuildId: nativeBuild.msBuildId }
  : { electronVersion: /^target="(.*)"$/m.exec(text)[1], msBuildId: /^ms_build_id="(.*)"$/m.exec(text)[1] };
test(`Electron metadata is read from ${metadata} and honours VSCODE_ELECTRON_VERSION`, () => {
  if (pnpm) assert.equal(nativeBuild.runtime, 'electron');
  fs.writeFileSync(path.join(fixture, metadata), text);
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
