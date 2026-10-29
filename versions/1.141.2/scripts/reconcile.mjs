// One-time, checked mechanical port of rejected 1.135 hunks to the pinned 1.139.1 tree.
// Run only after port-patches.sh; final reviewable changes are exported as a patch.
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
let waitingFor = process.argv[3];
if (!root) throw new Error('Usage: node reconcile.mjs <port-tree>/vscode');
function edit(file, transform) {
  if (waitingFor && waitingFor !== file) return;
  waitingFor = undefined;
  const name = path.join(root, file);
  const before = fs.readFileSync(name, 'utf8');
  const after = transform(before);
  if (before === after) throw new Error(`No change: ${file}`);
  fs.writeFileSync(name, after);
  console.log(file);
}
function replace(s, needle, value) {
  if (!s.includes(needle) || s.indexOf(needle) !== s.lastIndexOf(needle)) throw new Error(`Ambiguous/missing: ${needle}`);
  return s.replace(needle, value);
}
function removeBlock(s, start, end) {
  const a = s.indexOf(start), b = s.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`Missing block: ${start}`);
  return s.slice(0, a) + s.slice(b);
}
edit('build/gulpfile.vscode.ts', s => {
  s = replace(s, ', compileCopilotExtensionBuildTask', '');
  s = s.replace(/^import .* from '\.\/lib\/copilot\.ts';\n/m, '');
  s = removeBlock(s, 'const packageLock =', 'const sourceMappingURLBase =');
  s = removeBlock(s, '\t\t\t\tjson.copilotVersions =', '\t\t\t\t// Stamp agentSdks');
  s = s.replace(/\t+\/\/ The SDK runtime wrapper and native module must remain adjacent on disk\.\n\t+'\*\*\/@github\/copilot-sdk-.*\n/, '');
  const start = '\t\tconst vscodeTask = task.define(`vscode${dashed(platform)}${dashed(arch)}${dashed(minified)}`, task.series(';
  const a = s.indexOf(start), b = s.indexOf('\n\t\treturn vscodeTask;', a);
  if (a < 0 || b < 0) throw new Error('Build task block moved');
  const tasks = `\t\tconst prepackTask = task.define(\`vscode\${dashed(minified)}-prepack\`, task.series(
\t\t\tcheckApiProposalNamesTask,
\t\t\tcopyCodiconsTask,
\t\t\tcleanExtensionsBuildTask,
\t\t\tcompileNonNativeExtensionsBuildTask,
\t\t\tcompileExtensionMediaBuildTask,
\t\t\twriteISODate('out-build'),
\t\t\tesbuildBundleTask,
\t\t));
\t\ttask.task(prepackTask);
\t\tconst packingTask = task.define(\`vscode\${dashed(platform)}\${dashed(arch)}\${dashed(minified)}-packing\`, task.series(vscodeTaskCI));
\t\ttask.task(packingTask);
\t\tconst vscodeTask = task.define(\`vscode\${dashed(platform)}\${dashed(arch)}\${dashed(minified)}\`, task.series(prepackTask, packingTask));
\t\ttask.task(vscodeTask);
`;
  return s.slice(0, a) + tasks + s.slice(b);
});
edit('build/gulpfile.reh.ts', s => {
  s = replace(s, ', compileCopilotExtensionBuildTask', '');
  s = removeBlock(s, 'function prepareCopilotRipgrepShimTaskREH(', "['reh', 'reh-web'].forEach");
  return replace(s, 'https://main.vscode-cdn.net/sourcemaps/${commit}/core', 'https://github.com/VSCodium/sourcemaps/releases/download/${product.quality}-${commit}/core');
});
edit('build/gulpfile.vscode.web.ts', s => replace(s, 'https://main.vscode-cdn.net/sourcemaps/${commit}', 'https://github.com/VSCodium/sourcemaps/releases/download/${product.quality}-${commit}'));

const agent = 'src/vs/platform/agentHost/node/';
edit(agent + 'agentHostMain.ts', s => {
  s = s.replace(/^import .* from '\.\.\/common\/agentService\.js';$/m, "import { AgentHostIpcChannels, IAgentHostInspectInfo, IAgentHostSocketInfo, IConnectionTrackerService } from '../common/agentService.js';");
  s = s.replace(/^import .* from '\.\.\/common\/agentHostSchema\.js';\n/m, '');
  s = s.replace(/^\s*providerConfigurations: \[createCodexProviderConfiguration.*$/m, '\n\t\t\tproviderConfigurations: [],');
  s = removeBlock(s, '\t\tconst agentSdkDownloader = runtimeServices.agentSdkDownloader;', '\t} catch (err) {');
  return s.replace('// Sets up IPC, logging, and registers agent providers (Copilot).', '// Sets up IPC and logging without bundled proprietary agent providers.');
});
edit(agent + 'agentHostServerMain.ts', s => {
  s = s.replace(/^import .* from '\.\/(?:copilot\/copilotAgent|claude\/claudeAgent|claude\/claudeAgentSdkService|codex\/codexAgent|codex\/codexProviderConfiguration)\.js';\n/gm, '');
  s = s.replace(/^import .* from '\.\.\/common\/agentHostSchema\.js';\n/m, '');
  s = s.replace(/^\s*providerConfigurations: \[createCodexProviderConfiguration.*$/m, '\n\t\tproviderConfigurations: [],');
  s = removeBlock(s, '\t// Register agents\n', '\t// Surface agent-SDK download progress');
  return s.replace('\t// Surface agent-SDK download progress', '\tconst sdkDownloadProgress: Event<IAgentSdkDownloadProgress> | undefined = undefined;\n\n\t// Surface agent-SDK download progress');
});
edit(agent + 'agentHostServices.ts', s => s.replace(/^\tservices\.set\(I(?:ClaudeAgentSdkService|ClaudeProxyService|CodexProxyService|AgentHostOTelService),.*\n/gm, ''));
edit(agent + 'copilot/prompts/promptRegistry.ts', s => {
  s = s.replace(/^import .* from '(?:\.\.\/\.\.\/shared\/fileLinkInstructions|\.\.\/\.\.\/shared\/workspacelessInstructions|\.\/systemMessage|\.\/toolInstructions)\.js';\n/gm, '');
  const a = s.indexOf('\n\t/**\n\t * The per-model (or default) config');
  const b = s.indexOf('\n}\n\n/**\n * Shared registry instance.', a);
  if (a < 0 || b < 0) throw new Error('Prompt methods moved');
  return s.slice(0, a) + s.slice(b);
});
edit(agent + 'copilot/sessionCustomizationDiscovery.ts', s => {
  const a = s.indexOf('\tprivate async getDiscoveredDirectories(');
  const b = s.lastIndexOf('\t/**', s.indexOf('\tpublic async scan(', a));
  if (a < 0 || b < a) throw new Error('Discovery methods moved');
  s = s.slice(0, a) + s.slice(b);
  s = s.replace(/^type (?:AgentsDiscoverRequest|InstructionSource) = .*\n/gm, '');
  s = s.replace(/^import .* from '\.\/copilotPluginConverters\.js';\n/m, '');
  return s;
});
edit('src/vs/platform/agentHost/test/node/mockAgent.ts', s => s.replace(/^import .* from '\.\/historyRecordFixtures\.js';\n/m, ''));

for (const file of ['package.json', 'remote/package.json']) {
  edit(file, s => {
    const p = JSON.parse(s);
    for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const key of Object.keys(p[group] ?? {})) {
        if (/^(@github\/copilot|@anthropic-ai\/sdk|@anthropic-ai\/claude-agent-sdk|@openai\/codex)/.test(key)) delete p[group][key];
      }
    }
    delete p.copilotRuntimeVersion;
    if (p.dependencies['@vscode/policy-watcher']) {
      delete p.dependencies['@vscode/policy-watcher'];
      p.dependencies['@vscodium/policy-watcher'] = '1.4.0-265896';
    }
    if (file === 'remote/package.json') p.dependencies.tslib = '^2.6.3';
    return JSON.stringify(p, null, 2) + '\n';
  });
}
