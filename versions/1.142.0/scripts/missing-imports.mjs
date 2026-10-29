// List relative imports in the given TypeScript files whose targets do not exist under the tree root.
import fs from 'node:fs';
import path from 'node:path';
const [root, ...files] = process.argv.slice(2);
let missing = 0;
for (const file of files) {
  const abs = path.join(root, file);
  const text = fs.readFileSync(abs, 'utf8');
  for (const m of text.matchAll(/from '(\.[^']+)'/g)) {
    const target = path.resolve(path.dirname(abs), m[1]).replace(/\.js$/, '.ts');
    if (!fs.existsSync(target) && !fs.existsSync(target.replace(/\.ts$/, '.d.ts'))) {
      console.log(`${file}: ${m[1]}`);
      missing++;
    }
  }
}
process.exitCode = missing ? 1 : 0;
