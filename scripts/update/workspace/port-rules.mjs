// Resolutions that recur on every port, applied after finalize-port-<version>.mjs. Each rule is idempotent:
// it changes nothing when the tree already conforms, so the per-version finalize only has to pick conflict
// sides and handle what is new in that release. Exit 1 if a rule cannot run (e.g. unparsable package.json).
import fs from 'node:fs';
import path from 'node:path';
import { project, root, update } from './port-lib.mjs';

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
    s.replaceAll(', undefined, (_name, policies, callback) => {', ', undefined, (_vendorName, _name, policies, callback) => {')
      // 1.143.1: typed factory locals, (_productName, policies, callback) => ...
      .replace(/: NativePolicyWatcherFactory = \((?!_vendorName)(\w+), (\w+), (\w+)\) =>/g, ': NativePolicyWatcherFactory = (_vendorName, $1, $2, $3) =>'));
}

// 22-osproxy-use-custom-lib: macOS universal-app globs name the forked proxy resolver (1.141.2, 1.142.0).
rule('os-proxy-resolver-fork', 'build/darwin/create-universal-app.ts', s =>
  s.replaceAll('@vscode/os-proxy-resolver-darwin-', '@vscodium/os-proxy-resolver-darwin-'));

// Agent-host OTel service: removed with the Copilot SDK (its module imports @github/copilot-sdk), so a finalize can
// pick upstream's side and this strips what refers to it (hand-written in 1.142.0 and 1.143.1). Anything it does
// not cover still fails the typecheck. Lines are dropped only when they mention the service itself.
if (!fs.existsSync(path.join(root, 'src/vs/platform/agentHost/common/otel/agentHostOTelService.ts'))) {
  const dropOtelLines = s => s.split('\n').filter(l => !/import .*agentHostOTelService\.js'|@IAgentHostOTelService |^\s*NullAgentHostOTelService,$/.test(l)).join('\n');
  // Remove `this._otelService?.emitTurnTiming({ ... });` statements by brace matching.
  const dropCalls = (s, start) => {
    for (let a; (a = s.indexOf(start)) >= 0;) {
      let i = a + start.length - 1, depth = 0;
      for (; i < s.length; i++) { if (s[i] === '{' || s[i] === '(') depth++; else if (s[i] === '}' || s[i] === ')') { depth--; if (depth === 0 && s.startsWith(');', i)) break; } }
      if (i >= s.length) throw new Error(`unbalanced ${start}`);
      const lineStart = s.lastIndexOf('\n', a) + 1;
      s = s.slice(0, lineStart) + s.slice(s.indexOf('\n', i) + 1);
    }
    return s;
  };
  // Imports from the OTel helper modules are dropped only when nothing else in the file uses their names.
  const dropUnusedImports = (s, ...modules) => s.split('\n').filter(l => {
    const m = /^import \{([^}]*)\} from '[^']*\/(?:[^/']+)\.js';$/.exec(l);
    if (!m || !modules.some(mod => l.includes(`/${mod}.js'`))) return true;
    const names = m[1].split(',').map(n => n.trim().replace(/^type /, '').split(' as ').pop()).filter(Boolean);
    return names.some(n => s.split(n).length - 1 > 1);
  }).join('\n');
  rule('agent-host-otel', 'src/vs/platform/agentHost/node/protocolServerHandler.ts', s =>
    dropUnusedImports(dropOtelLines(s).replaceAll('this._otelService?.diagnosticsEnabled', 'false'), 'agentHostTiming', 'chatUserInteraction'));
  rule('agent-host-otel', 'src/vs/platform/agentHost/node/agentService.ts', dropOtelLines);
  rule('agent-host-otel', 'src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', s =>
    dropCalls(dropOtelLines(s), 'this._otelService?.emitTurnTiming(').replace(/this\._otelService\??\.enabled/g, 'false'));
  // Tests: drop the tests that exercise the OTel bridge, then the service argument everywhere else.
  rule('agent-host-otel', 'src/vs/platform/agentHost/test/node/protocolServerHandler.test.ts', s => {
    let lines = s.split('\n');
    for (let hit; (hit = lines.findIndex(l => l.includes('...NullAgentHostOTelService'))) >= 0;) {
      let a = hit; while (a >= 0 && !/^\t+test\(/.test(lines[a])) a--;
      if (a < 0) throw new Error('OTel test without an enclosing test(');
      const end = lines.indexOf(lines[a].match(/^\t+/)[0] + '});', a);
      lines.splice(a, end - a + 1 + (lines[end + 1] === '' ? 1 : 0));
    }
    s = dropOtelLines(lines.join('\n')).replaceAll(' NullAgentHostOTelService,', '');
    return s.split('\n').filter(l => !/^import \{ type IAgentHostFirstResponseDiagnostic \} from/.test(l)).join('\n');
  });
}

// Session comparison metadata is only read by the removed provider agents, so taking upstream's agentService.ts
// import list leaves it unused (1.143.1, 1.144.0). Dropped only while the import is its sole mention.
rule('unused-session-comparison-import', 'src/vs/platform/agentHost/node/agentService.ts', s =>
  s.split('readSessionComparisonMetadata').length === 2 ? s.replace(' readSessionComparisonMetadata,', '') : s);

console.log(`Rules changed ${changed} file(s).`);
