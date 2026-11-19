// Shared helpers for port-rules.mjs and the per-version finalize-port-<version>.mjs.
// The porting tree is the vscode/ directory of work/latest-path.txt; labels come from port.json/config.json,
// matching the conflict markers merge-from.sh writes (<prev>-port / <prev> / <new>).
import fs from 'node:fs';
import path from 'node:path';

export const project = path.resolve(import.meta.dirname, '..');
const json = file => JSON.parse(fs.readFileSync(path.join(project, file), 'utf8'));
export const prev = json('port.json').from;
export const next = json('config.json').vscode_version;
export const root = path.join(fs.readFileSync(path.join(project, 'work/latest-path.txt'), 'utf8').trim(), 'vscode');
export const read = file => fs.readFileSync(path.join(root, file), 'utf8');
export const exists = file => fs.existsSync(path.join(root, file));

// Strict edit for finalize scripts: the change must happen, so a stale resolution fails loudly.
export const edit = (file, fn) => {
  const before = read(file);
  const after = fn(before);
  if (before === after) throw new Error(`No change: ${file}`);
  fs.writeFileSync(path.join(root, file), after);
  console.log(file);
};
// Lenient edit for rules: skip missing files, report only real changes. Returns whether the file changed.
export const update = (rule, file, fn) => {
  if (!exists(file)) return false;
  const before = read(file);
  const after = fn(before);
  if (before === after) return false;
  fs.writeFileSync(path.join(root, file), after);
  console.log(`RULE ${rule}: ${file}`);
  return true;
};
export const replace = (s, old, fresh) => {
  if (!s.includes(old) || s.indexOf(old) !== s.lastIndexOf(old)) throw new Error(`Missing or ambiguous: ${old.slice(0, 160)}`);
  return s.replace(old, fresh);
};
export const replaceAll = (s, old, fresh, count) => {
  const found = s.split(old).length - 1;
  if (count !== undefined && found !== count) throw new Error(`Expected ${count} of ${old}, found ${found}`);
  return s.split(old).join(fresh);
};
export const dropLines = (text, ...needles) => {
  for (const needle of needles) {
    const lines = text.split('\n');
    const kept = lines.filter(l => !l.includes(needle));
    if (kept.length !== lines.length - 1) throw new Error(`Expected one line with ${needle}, found ${lines.length - kept.length}`);
    text = kept.join('\n');
  }
  return text;
};
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const conflictPattern = () =>
  new RegExp(`<<<<<<< ${escape(prev)}-port\\n([\\s\\S]*?)=======\\n([\\s\\S]*?)>>>>>>> ${escape(next)}\\n`, 'g');
// Resolve the merge-file conflicts in `file`, in order. A choice is 'ours' (the previous port), 'theirs'
// (new upstream) or a function (ours, theirs) => text. The number of conflicts is checked.
export const resolve = (file, choices) => edit(file, s => {
  const found = [...s.matchAll(conflictPattern())].length;
  if (found !== choices.length) throw new Error(`${file}: expected ${choices.length} conflicts, found ${found}`);
  let i = 0;
  return s.replace(conflictPattern(), (_, ours, theirs) => {
    const choice = choices[i++];
    return choice === 'ours' ? ours : choice === 'theirs' ? theirs : choice(ours, theirs);
  });
});
