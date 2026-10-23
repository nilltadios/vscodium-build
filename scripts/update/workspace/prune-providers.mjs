// Remove new SDK-only modules and tests for providers omitted from this local build.
import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname, '..');
const root = path.join(fs.readFileSync(path.join(project, 'work/latest-path.txt'), 'utf8').trim(), 'vscode');
const agent = path.join(root, 'src/vs/platform/agentHost');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(agent).filter(f => f.endsWith('.ts'));
const remove = new Set(files.filter(f => {
  const relative = path.relative(agent, f);
  return /^(?:test\/node\/(?:copilot[^/]*|claude[^/]*|providerIntegration\/.*)|test\/node\/fixtures\/claude[^/]*)\.ts$/.test(relative)
    || /^import .*from ['"](?:@github\/copilot|@anthropic-ai\/|@openai\/codex)/m.test(fs.readFileSync(f, 'utf8'));
}));
// Include helpers whose only consumers were the removed provider implementations.
for (const relative of ['node/copilot/copilotCustomizationCommandDisplay.ts']) remove.add(path.join(agent, relative));
for (const file of remove) {
  if (fs.existsSync(file)) { fs.unlinkSync(file); console.log(path.relative(root, file)); }
}
// Then, until nothing changes, provider-folder modules and *.test.ts files that import a removed module
// (1.143.1: saved-chat readers, the Copilot local-model bridge and their tests). Core modules and files with
// conflict markers are left to finalize.
const providerOrTest = /^(?:node\/(?:copilot|claude|codex)\/.*|test\/.*\.test)\.ts$/;
const missingImport = f => !/^<<<<<<< /m.test(fs.readFileSync(f, 'utf8')) && [...fs.readFileSync(f, 'utf8').matchAll(/^import [^;]*?from ['"](\.[^'"]+)\.js['"]/gm)]
  .some(m => !fs.existsSync(path.resolve(path.dirname(f), m[1] + '.ts')) && !fs.existsSync(path.resolve(path.dirname(f), m[1] + '.js')));
for (let more = true; more;) {
  more = false;
  for (const file of walk(agent).filter(f => f.endsWith('.ts') && providerOrTest.test(path.relative(agent, f)))) {
    if (missingImport(file)) { fs.unlinkSync(file); console.log(path.relative(root, file)); more = true; }
  }
}
