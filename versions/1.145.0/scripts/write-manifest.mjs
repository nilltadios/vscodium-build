import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const project = path.resolve(import.meta.dirname, '..');
const target = path.resolve(process.argv[2]);
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const appimage = fs.readFileSync(path.join(project, 'evidence/latest-appimage.txt'), 'utf8').trim();
const manifest = {
  createdAt: new Date().toISOString(),
  unofficial: true,
  target: 'linux-x64',
  workDirectory: target,
  config: readJSON(path.join(project, 'config.json')),
  sources: readJSON(path.join(project, 'sources.lock.json')),
  containerImage: readJSON(path.join(project, 'evidence/container-image.json'))[0].Id,
  patchManifestSha256: sha256(path.join(project, 'evidence/port-patches.sha256')),
  appRunSha256: sha256(path.join(project, 'scripts/AppRun')),
  branding: {
    svgSha256: sha256(path.join(project, 'assets/branding/logo.svg')),
    pngSha256: sha256(path.join(project, 'assets/branding/logo.png')),
    defaultThemeSha256: sha256(path.join(project, 'assets/branding/local-theme-defaults/package.json')),
    desktopTemplateSha256: sha256(path.join(project, 'scripts/vscodium-local.desktop')),
    desktopVersion: readJSON(path.join(target, 'VSCode-linux-x64/resources/app/package.json')).version
  },
  rootNpmLockSha256: sha256(path.join(target, 'vscode/package-lock.json')),
  appimagetool: readJSON(path.join(project, 'appimagetool.lock.json')),
  runtime: readJSON(path.join(project, 'appimage-runtime.lock.json')),
  artifact: { path: appimage, bytes: fs.statSync(appimage).size, sha256: sha256(appimage) },
  limits: { cpus: 4, memory: '8g', memoryAndSwap: '12g' },
  scope: 'Local Linux x64 build. GUI evidence is recorded separately. No packet-capture audit or validation of other platforms.'
};
const output = `${appimage}.manifest.json`;
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(output);
