// Compare the intended port tree to the failed fresh build and export omitted removals.
import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname, '..');
const fresh = path.join(fs.readFileSync(path.join(project, 'work/latest-path.txt'), 'utf8').trim(), 'vscode');
const port = path.join(project, 'work/20261002T104058121937812Z/vscode');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const missing = walk(path.join(fresh, 'src')).filter(f => f.endsWith('.ts') && !fs.existsSync(path.join(port, path.relative(fresh, f))));
let patch = '';
for (const file of missing) {
  const relative = path.relative(fresh, file);
  const source = fs.readFileSync(file, 'utf8');
  if (!source.endsWith('\n')) throw new Error(`Missing final newline: ${relative}`);
  const lines = source.slice(0, -1).split('\n');
  patch += `diff --git a/${relative} b/${relative}\ndeleted file mode 100644\n--- a/${relative}\n+++ /dev/null\n@@ -1,${lines.length} +0,0 @@\n`;
  patch += lines.map(l => '-' + l + '\n').join('');
  console.log(relative);
}
if (!missing.length) throw new Error('No omitted removals found');
fs.writeFileSync(path.join(project, 'patches/rebased/user/zzz-retire-provider-files.patch'), patch);
