// VS Code 1.146 builds with pnpm (packageManager in package.json, pnpm-lock.yaml); VSCodium's build scripts at
// ca7f7b4 still call npm. When the work tree's vscode/ has pnpm-lock.yaml, rewrite the work copies of the
// scripts our container build runs (build.sh, prepare_vscode.sh) to the pnpm commands upstream's own pipeline
// uses (build/azure-pipelines/linux/product-build-linux-node-modules.yml). Every expected line must be present,
// so a VSCodium revision of these scripts stops here instead of silently running npm.
// Usage: node vscodium-pnpm.mjs <work-dir>
import fs from 'node:fs';
import path from 'node:path';

const work = path.resolve(process.argv[2]);
if (!fs.existsSync(path.join(work, 'vscode/pnpm-lock.yaml'))) process.exit(0);
// Already rewritten (prepare-work.sh copies fresh scripts, so this only matters on a manual rerun).
if (fs.readFileSync(path.join(work, 'prepare_vscode.sh'), 'utf8').includes('\npnpm run preinstall\n')) process.exit(0);
const rewrite = (file, pairs) => {
  const full = path.join(work, file);
  let s = fs.readFileSync(full, 'utf8');
  for (const [old, fresh, count] of pairs) {
    const found = s.split(old).length - 1;
    if (found !== count) throw new Error(`vscodium-pnpm: ${file}: expected ${count} x ${JSON.stringify(old)}, found ${found}`);
    s = s.replaceAll(old, fresh);
  }
  fs.writeFileSync(full, s);
  console.log(`vscodium-pnpm: ${file}`);
};
rewrite('prepare_vscode.sh', [
  // preinstall.ts now requires pnpm's npm_config_node_gyp and checks the pinned pnpm version.
  ['\nnode build/npm/preinstall.ts\n', '\npnpm run preinstall\n', 1],
  ['CXX=clang++ npm ci && break', 'CXX=clang++ pnpm install --frozen-lockfile && break', 1],
  ['    npm ci && break', '    pnpm install --frozen-lockfile && break', 1],
]);
rewrite('build.sh', [
  ['npm run gulp ', 'pnpm run gulp ', 6],
  ['npm run copy-policy-dto --prefix build', 'pnpm -C build run copy-policy-dto', 3],
]);
// pnpm's isolated linker stores real package files under node_modules/.pnpm/, which ripgrep skips without
// --hidden. VS Code 1.147 also dropped @vscode/ripgrep in favor of @vscode/ripgrep-universal, so without
// updating the rg path undo_telemetry.sh hits "No such file or directory" and silently skips scrubbing.
const rootPkg = JSON.parse(fs.readFileSync(path.join(work, 'vscode/package.json'), 'utf8'));
const rootDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies };
const rgBin = !rootDeps['@vscode/ripgrep'] && rootDeps['@vscode/ripgrep-universal']
  ? './node_modules/@vscode/ripgrep-universal/bin/linux-x64/rg'
  : './node_modules/@vscode/ripgrep/bin/rg';
rewrite('undo_telemetry.sh', [
  ['    ./node_modules/@vscode/ripgrep/bin/rg --no-ignore -l "${SEARCH}" .',
    `    ${rgBin} --hidden --no-ignore --glob '!.git/**' -l "\${SEARCH}" .`, 1],
]);
