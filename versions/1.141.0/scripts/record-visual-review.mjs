// Run only after viewing the saved screenshot. This records, not infers, the review.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const project = path.resolve(import.meta.dirname, '..');
if (process.argv[2] !== '--passed' || !process.argv[3]) throw new Error('Usage: node scripts/record-visual-review.mjs --passed "observations from screenshot"');
const evidence = fs.readFileSync(path.join(project, 'evidence/latest-gui.txt'), 'utf8').trim();
const screenshot = path.join(evidence, 'screen.png');
const result = {
  reviewedAt: new Date().toISOString(),
  passed: true,
  screenshot,
  screenshotSha256: createHash('sha256').update(fs.readFileSync(screenshot)).digest('hex'),
  observations: process.argv[3],
  scope: 'Manual screenshot review, correlated with the saved process/mount checks. This is a startup smoke test.'
};
fs.writeFileSync(path.join(evidence, 'visual-review.json'), JSON.stringify(result, null, 2) + '\n');
console.log(path.join(evidence, 'visual-review.json'));
