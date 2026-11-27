import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2]);
let failures = 0;
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (file.endsWith('.ts')) {
      const text = fs.readFileSync(file, 'utf8');
      // Only top-level import declarations, not illustrative imports in comments.
      for (const match of text.matchAll(/^import\s+[^\n]*?from\s*['"]([^'"]+)['"]/gm)) {
        const spec = match[1];
        if (!spec.startsWith('.') || !spec.endsWith('.js')) continue;
        const base = path.resolve(path.dirname(file), spec.slice(0, -3));
        if (['.ts', '.tsx', '.js', '.d.ts'].some(ext => fs.existsSync(base + ext))) continue;
        console.log(`${path.relative(root, file)} -> ${spec}`);
        failures++;
      }
    }
  }
}
walk(path.join(root, 'src'));
console.log(`Missing relative imports: ${failures}`);
process.exitCode = failures ? 1 : 0;
