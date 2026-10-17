// Summarize evidence/port/ (written by port.sh) as one short Markdown report. Exit 0 when the port is clean:
// every step passed, finalize exists, no conflict markers, and the typecheck reported no errors.
import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname, '..');
const out = path.join(project, 'evidence/port');
const read = name => { try { return fs.readFileSync(path.join(out, name), 'utf8'); } catch { return ''; } };
const lines = text => text.split('\n').filter(Boolean);
const config = JSON.parse(fs.readFileSync(path.join(project, 'config.json'), 'utf8'));
const prev = JSON.parse(fs.readFileSync(path.join(project, 'port.json'), 'utf8')).from;
const next = config.vscode_version;
const walk = dir => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : [];
const hunks = dir => walk(path.join(project, dir)).filter(f => f.endsWith('.rej'))
  .reduce((n, f) => n + lines(fs.readFileSync(f, 'utf8')).filter(l => l.startsWith('@@')).length, 0);
const steps = Object.fromEntries(lines(read('steps.tsv')).slice(1).map(l => l.split('\t')).map(([s, e, t]) => [s, { exit: e, seconds: t }]));
const rejects = lines(read('port-rejects-patches.txt') + read('port-rejects-replay.txt'));
const count = kind => rejects.filter(l => l.startsWith(kind)).length;
const merge = lines(read('merge.txt')).map(l => l.split('\t'));
const markers = lines(read('markers.txt'));
const typecheck = read('typecheck.txt');
const tsErrors = lines(typecheck).filter(l => /error TS\d+/.test(l));
const finalizeExit = steps.finalize?.exit;
const problems = [];
for (const [name, s] of Object.entries(steps)) {
  if (!['0', 'skipped', 'missing'].includes(s.exit)) problems.push(`step ${name} exit ${s.exit}`);
}
if (markers.length) problems.push(`${markers.length} file(s) still have conflict markers`);
if (tsErrors.length) problems.push(`${tsErrors.length} TS error(s)`);
if (steps.typecheck?.exit !== '0') problems.push('typecheck did not pass');

const r = [];
r.push(`# Port ${prev} -> ${next}: ${problems.length ? 'NOT CLEAN' : 'clean'}`, '');
r.push(`Tree: ${read('port-tree.txt').trim()}`, '');
r.push(`- Rebase of ${prev}'s patches: ${hunks('evidence/rejects')} rejected hunk(s); replay of the ${prev} port patch: ${hunks(`evidence/rejects-port-${prev}`)}.`);
r.push(`- port-rejects.mjs: ${count('APPLIED')} applied, ${count('UNRESOLVED')} unresolved, ${count('MISSING')} missing-file.`);
r.push(`- Three-way merge: ${merge.length} file(s), ${merge.reduce((n, [c]) => n + (Number(c) > 0 ? Number(c) : 0), 0)} conflict(s)` +
  (merge.some(([c]) => !/^\d+$/.test(c)) ? `; ${merge.filter(([c]) => !/^\d+$/.test(c)).map(([c, f]) => `${c} ${f}`).join(', ')}` : '') + '.');
const unresolvedPkg = rejects.filter(l => /^UNRESOLVED (\S*\/)?package\.json:/.test(l)).length;
if (unresolvedPkg) r.push(`- package.json hunks left to port-rules.mjs and the lock refresh: ${unresolvedPkg}.`);
r.push(`- Pruned provider modules: ${lines(read('prune.txt')).length}. Rules: ${lines(read('rules.txt')).filter(l => l.startsWith('RULE')).length} change(s).`);
r.push(`- finalize-port-${next}.mjs: ${finalizeExit === 'missing' ? 'not written yet' : finalizeExit === '0' ? 'ok' : `FAILED (exit ${finalizeExit})`}.`);
r.push(`- Dependencies: ${steps.deps?.exit === '0' ? lines(read('deps.txt')).at(-1) : `install exit ${steps.deps?.exit ?? 'not run'}`}.`);
r.push(`- Typecheck: ${steps.typecheck ? (steps.typecheck.exit === 'skipped' ? 'skipped (conflict markers)' : `exit ${steps.typecheck.exit}, ${tsErrors.length} error(s)`) : 'not run'}.`);
r.push('', `Steps (s): ${Object.entries(steps).map(([n, s]) => `${n} ${s.seconds}`).join(', ')}.`);
if (finalizeExit && !['0', 'missing'].includes(finalizeExit)) {
  r.push('', '## finalize error', '', '```', ...lines(read('finalize.txt')).filter(l => /Error|at file:/.test(l)).slice(0, 6), '```');
}
if (markers.length) {
  r.push('', '## Conflicts to resolve in finalize-port-' + next + '.mjs', '');
  const tree = read('port-tree.txt').trim();
  for (const file of markers) {
    const n = (fs.readFileSync(path.join(tree, file), 'utf8').match(/^<<<<<<< /gm) ?? []).length;
    r.push(`- ${file}: ${n} (copy before finalize: evidence/merge-conflicted/${file})`);
  }
}
if (tsErrors.length) r.push('', '## TS errors (first 20)', '', '```', ...tsErrors.slice(0, 20).map(l => l.slice(0, 220)), '```');
for (const name of Object.keys(steps).filter(n => !['0', 'skipped', 'missing'].includes(steps[n].exit) && !['finalize', 'typecheck'].includes(n))) {
  r.push('', `## ${name} output (last 8 lines)`, '', '```', ...lines(read(`${name}.txt`)).slice(-8), '```');
}
r.push('', problems.length ? `Not clean: ${problems.join('; ')}. Edit scripts/finalize-port-${next}.mjs (or port-rules.mjs for a recurring fix) and rerun: bash scripts/port.sh` : 'Clean: port.sh exports user/zzzz-port-' + next + '.patch and probes the patch set.');
console.log(r.join('\n'));
process.exit(problems.length ? 1 : 0);
