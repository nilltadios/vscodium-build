// Resolutions that recur on every port, applied after finalize-port-<version>.mjs. Each rule is idempotent:
// it changes nothing when the tree already conforms, so the per-version finalize only has to pick conflict
// sides and handle what is new in that release. Exit 1 if a rule cannot run (e.g. unparsable package.json).
import fs from 'node:fs';
import path from 'node:path';
import { project, update } from './port-lib.mjs';

let changed = 0;
const rule = (name, file, fn) => { if (update(name, file, fn)) changed++; };

// 53-ext-copilot-remove-it: bundled agent SDKs are dropped by name (their versions change every release,
// so the patch's version-pinned hunks are rejected). Seen in 1.141.0, 1.141.2, 1.142.0.
const sdk = /^(@github\/copilot|@anthropic-ai\/|@openai\/codex)/;
for (const file of ['package.json', 'remote/package.json']) {
  rule('remove-agent-sdks', file, s => {
    const pkg = JSON.parse(s);
    let dirty = 'copilotRuntimeVersion' in pkg;
    for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const name of Object.keys(pkg[group] ?? {})) {
        if (sdk.test(name)) { delete pkg[group][name]; dirty = true; }
      }
    }
    delete pkg.copilotRuntimeVersion;
    return dirty ? JSON.stringify(pkg, null, 2) + '\n' : s;
  });
}

// 21-policy-use-custom-lib: keep VSCodium's policy-watcher fork when upstream bumps @vscode/policy-watcher
// (1.142.0). The fork version comes from VSCodium's own patch: the rebased copy in patches/rebased loses that
// line exactly when the package.json hunk is rejected, which is when this rule is needed.
const policyPatch = path.join(project, 'sources/vscodium/patches/21-policy-use-custom-lib.patch');
const policyFork = fs.existsSync(policyPatch)
  ? /^\+\s*"@vscodium\/policy-watcher": "([^"]+)"/m.exec(fs.readFileSync(policyPatch, 'utf8'))?.[1] : undefined;
if (!policyFork) {
  console.error(`policy-watcher-fork: no "@vscodium/policy-watcher" version in ${policyPatch}; update this rule.`);
  process.exitCode = 1;
} else {
  rule('policy-watcher-fork', 'package.json', s => s
    .replace(/^(\s*)"@vscode\/policy-watcher": "[^"]*"(,?)$/m, `$1"@vscodium/policy-watcher": "${policyFork}"$2`)
    .replace(/^(\s*)"@vscode\/policy-watcher@[^"]*": true(,?)$/m, `$1"@vscodium/policy-watcher@${policyFork}": true$2`));
  // The fork's watcher factory takes the vendor name first; new upstream tests use the 3-argument shape
  // (1.141.2: two tests, 1.142.0: one).
  rule('policy-watcher-vendor-arg', 'src/vs/platform/policy/test/node/nativeManagedSettingsService.test.ts', s =>
    s.replaceAll(', undefined, (_name, policies, callback) => {', ', undefined, (_vendorName, _name, policies, callback) => {'));
}

// 22-osproxy-use-custom-lib: macOS universal-app globs name the forked proxy resolver (1.141.2, 1.142.0).
rule('os-proxy-resolver-fork', 'build/darwin/create-universal-app.ts', s =>
  s.replaceAll('@vscode/os-proxy-resolver-darwin-', '@vscodium/os-proxy-resolver-darwin-'));

console.log(`Rules changed ${changed} file(s).`);
