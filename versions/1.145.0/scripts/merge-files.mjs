// List the files the three-way merge must handle, from port-rejects.mjs output (stdin or file arguments):
// every file with an UNRESOLVED or MISSING hunk, except package.json files, whose rejected hunks are
// dependency/version lines that port-rules.mjs and the lock refresh handle (merging them would also pull in
// the previous build tree's version-stamped package.json).
// For 1.141.2 -> 1.142.0 this yields the 13 files of the hand-written evidence/merge-files.txt.
import fs from 'node:fs';
const input = process.argv.length > 2
  ? process.argv.slice(2).map(f => fs.readFileSync(f, 'utf8')).join('\n')
  : fs.readFileSync(0, 'utf8');
const files = new Set();
for (const line of input.split('\n')) {
  const unresolved = /^UNRESOLVED (.+?):\d+ /.exec(line)?.[1];
  // MISSING lines name the reject file, whose first line is "diff a/<path> b/<path>".
  const reject = /^MISSING (.+)$/.exec(line)?.[1];
  const missing = reject && /^diff a\/(.*?) b\//.exec(fs.readFileSync(reject, 'utf8'))?.[1];
  const file = unresolved ?? missing;
  if (file && !/(^|\/)package(-lock)?\.json$/.test(file)) files.add(file);
}
console.log([...files].join('\n'));
