// Apply uniquely matching replacement blocks from saved rejected hunks.
import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname, '..');
const root = path.join(fs.readFileSync(path.join(project, 'work/latest-path.txt'), 'utf8').trim(), 'vscode');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
for (const reject of walk(path.join(project, 'evidence/rejects')).filter(p => !p.includes('package-lock.json'))) {
  const lines = fs.readFileSync(reject, 'utf8').split('\n');
  const file = lines[0].match(/^diff a\/(.*?) b\//)?.[1];
  if (!file || !fs.existsSync(path.join(root, file))) { console.log(`MISSING ${reject}`); continue; }
  let source = fs.readFileSync(path.join(root, file), 'utf8');
  for (let i = 1; i < lines.length; i++) {
    if (!/^[+-]/.test(lines[i])) continue;
    const start = i;
    const old = [], fresh = [];
    while (i < lines.length && /^[+-]/.test(lines[i])) {
      if (lines[i][0] === '-') old.push(lines[i].slice(1)); else fresh.push(lines[i].slice(1));
      i++;
    }
    let needle = old.length ? old.join('\n') + '\n' : '';
    let replacement = fresh.length ? fresh.join('\n') + '\n' : '';
    if (!old.length) {
      const prior = lines.slice(1, start).reverse().find(l => l.startsWith(' '));
      const next = lines.slice(i).find(l => l.startsWith(' '));
      if (!prior || !next) { console.log(`UNRESOLVED ${file}:${start} insertion`); continue; }
      needle = prior.slice(1) + '\n' + next.slice(1) + '\n';
      replacement = prior.slice(1) + '\n' + replacement + next.slice(1) + '\n';
    }
    const at = source.indexOf(needle);
    if (at < 0 || at !== source.lastIndexOf(needle)) {
      console.log(`UNRESOLVED ${file}:${start} ${JSON.stringify(needle.slice(0, 120))}`);
      continue;
    }
    source = source.slice(0, at) + replacement + source.slice(at + needle.length);
    console.log(`APPLIED ${file}:${start}`);
  }
  fs.writeFileSync(path.join(root, file), source);
}
