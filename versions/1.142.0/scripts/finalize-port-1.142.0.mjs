// Manual resolutions for porting the 1.141.2 patch set to VS Code 1.142.0.
// Run by port-1.142.0.sh after port-rejects.mjs and merge-from-1.141.2.sh, on a fresh porting tree.
// Each conflict left by the three-way merge is resolved explicitly (count is checked), then
// follow-up edits remove references to modules the port deletes (Codex provider, agent-host OTel
// service, which imports @github/copilot-sdk).
import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname, '..');
const root = path.join(fs.readFileSync(path.join(project, 'work/latest-path.txt'), 'utf8').trim(), 'vscode');
const edit = (file, fn) => {
  const name = path.join(root, file);
  const before = fs.readFileSync(name, 'utf8');
  const after = fn(before);
  if (before === after) throw new Error(`No change: ${file}`);
  fs.writeFileSync(name, after);
  console.log(file);
};
const replace = (s, old, fresh) => {
  if (!s.includes(old) || s.indexOf(old) !== s.lastIndexOf(old)) throw new Error(`Missing or ambiguous: ${old.slice(0, 160)}`);
  return s.replace(old, fresh);
};
const replaceAll = (s, old, fresh, count) => {
  const found = s.split(old).length - 1;
  if (found !== count) throw new Error(`Expected ${count} of ${old}, found ${found}`);
  return s.split(old).join(fresh);
};
const dropLines = (text, ...needles) => {
  for (const needle of needles) {
    const lines = text.split('\n');
    const kept = lines.filter(l => !l.includes(needle));
    if (kept.length !== lines.length - 1) throw new Error(`Expected one line with ${needle}, found ${lines.length - kept.length}`);
    text = kept.join('\n');
  }
  return text;
};
// Resolve the merge-file conflicts in `file`, in order. A choice is 'ours' (1.141.2 port), 'theirs' (1.142.0)
// or a function (ours, theirs) => text.
const conflict = /<<<<<<< 1\.141\.2-port\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> 1\.142\.0\n/g;
const resolve = (file, choices) => edit(file, s => {
  const found = [...s.matchAll(conflict)].length;
  if (found !== choices.length) throw new Error(`${file}: expected ${choices.length} conflicts, found ${found}`);
  let i = 0;
  return s.replace(conflict, (_, ours, theirs) => {
    const choice = choices[i++];
    return choice === 'ours' ? ours : choice === 'theirs' ? theirs : choice(ours, theirs);
  });
});

// 1.142 replaced the MCP welcome page with the Customizations marketplace link (no "VS Code" text left to brand)
// and collapsed the MCP views into one. Keep 00-copilot-fix-action-condition: hide it when AI features are disabled.
resolve('src/vs/workbench/contrib/mcp/browser/mcpServersView.ts', ['theirs', (_, theirs) => replace(theirs,
  'ChatContextKeys.Setup.disabledInWorkspace.negate()),',
  "ChatContextKeys.Setup.disabledInWorkspace.negate(), ContextKeyExpr.has('config.chat.disableAIFeatures').negate()),")]);

// 00-ui-custom-font: tab heights follow the configured font; 1.142 adds the "connected" tab style heights.
resolve('src/vs/workbench/browser/parts/editor/editorTabsControl.ts', [(ours) => replace(ours,
  '\t\t\tmodernUICompact: FONT.tabsSize28,\n',
  '\t\t\tmodernUICompact: FONT.tabsSize28,\n\t\t\tconnected: FONT.tabsSize28,\n\t\t\tconnectedCompact: 24 as const,\n')]);
// 1.142 dropped nextCharLength; the custom-font patch still needs IConfigurationService.
resolve('src/vs/workbench/browser/parts/editor/multiEditorTabsControl.ts', [ours => dropLines(ours, 'nextCharLength')]);

// 22-osproxy-use-custom-lib on 1.142's macOS globs (the mxc-sdk entries were removed upstream).
resolve('build/darwin/create-universal-app.ts', [(_, theirs) => replaceAll(theirs, '@vscode/os-proxy-resolver-darwin-', '@vscodium/os-proxy-resolver-darwin-', 4)]);

// 53-ext-copilot-remove-it: 1.142 removed getMxcExcludeFilter; the Copilot runtime packaging is already removed.
resolve('build/gulpfile.reh.ts', ['ours']);
edit('build/gulpfile.reh.ts', s => dropLines(s, 'filter(getMxcExcludeFilter(').replace(
  "import { getMxcExcludeFilter, getRipgrepExcludeFilter } from './lib/copilot.ts';", "import { getRipgrepExcludeFilter } from './lib/copilot.ts';"));
resolve('build/gulpfile.vscode.ts', [() => "import { getRipgrepExcludeFilter } from './lib/copilot.ts';\n"]);
edit('build/gulpfile.vscode.ts', s => dropLines(s, 'filter(getMxcExcludeFilter('));

// Session titles: keep the port's deterministic fallback titles (no Copilot API / utility-model title generation).
// The 1.142 utility-model service is still passed through, as an unused optional dependency.
resolve('src/vs/platform/agentHost/node/agentHostBootstrap.ts', ['theirs', 'theirs', 'theirs']);
resolve('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', [
  (ours, theirs) => dropLines(theirs, 'GitHubIssueOrPullRequest', 'ICopilotUtilityChatMessage').replace(
    'import { AgentHostUtilityModelUnavailableError, type IAgentHostUtilityModelContext, type IAgentHostUtilityModelService }',
    'import { type IAgentHostUtilityModelContext, type IAgentHostUtilityModelService }'),
  'ours', 'theirs', 'ours']);
resolve('src/vs/platform/agentHost/test/node/agentServiceTestUtils.ts', ['theirs', 'theirs']);

// Agent-host OTel service is removed (imports @github/copilot-sdk): no OTel injection or diagnostics bridge.
resolve('src/vs/platform/agentHost/node/agentService.ts', [(_, theirs) => replace(theirs, ' readSessionComparisonMetadata,', ''), (_, theirs) => dropLines(theirs, 'IAgentHostOTelService')]);
resolve('src/vs/platform/agentHost/node/protocolServerHandler.ts', [
  (_, theirs) => dropLines(theirs, 'agentHostOTelService', 'agentHostFirstResponseValidator', 'chatUserInteraction.js'),
  (_, theirs) => replace(theirs, 'this._otelService?.diagnosticsEnabled', 'false')]);
resolve('src/vs/platform/agentHost/test/node/protocolServerHandler.test.ts', [
  (_, theirs) => dropLines(theirs, 'NullAgentHostOTelService', 'IAgentHostFirstResponseDiagnostic'),
  'ours']);
edit('src/vs/platform/agentHost/test/node/protocolServerHandler.test.ts', s => replaceAll(s, 'devContainerService, NullAgentHostOTelService,', 'devContainerService,', 16));

// Telemetry reporter: keep 1.142's events (inert while telemetry is disabled) minus Codex account fields and OTel timing.
resolve('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', [
  (_, theirs) => dropLines(theirs, 'codexAccountTelemetry.js'),
  'ours', 'ours', 'theirs', 'theirs',
  (_, theirs) => replace(theirs, 'isOtelEnabled: this._otelService.enabled', 'isOtelEnabled: false'),
  'theirs',
  (_, theirs) => {
    const a = theirs.indexOf('\t\tthis._otelService?.emitTurnTiming({');
    const b = theirs.indexOf('\t\tthis._telemetryService.publicLog2');
    return dropLines(dropLines(theirs.slice(0, a) + theirs.slice(b), "getCodexAccountTelemetryData("), "codexModelProvider: report.codexModelProvider");
  },
  (_, theirs) => dropLines(theirs, "report.provider === 'codex'")]);

// 21-policy-use-custom-lib: 1.142 only bumped @vscode/policy-watcher to ^1.6.0 (policy sources unchanged);
// keep VSCodium's fork.
edit('package.json', s => {
  s = replace(s, '    "@vscode/policy-watcher": "^1.6.0",\n', '    "@vscodium/policy-watcher": "1.4.0-265896",\n');
  return replace(s, '    "@vscode/policy-watcher@1.6.0": true,\n', '    "@vscodium/policy-watcher@1.4.0-265896": true,\n');
});
// 53-ext-copilot-remove-it: SDK versions changed again in 1.142, so remove the SDKs by name (as in 1.141.2).
for (const file of ['package.json', 'remote/package.json']) {
  edit(file, s => {
    const pkg = JSON.parse(s);
    for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const name of Object.keys(pkg[group] ?? {})) {
        if (/^(@github\/copilot|@anthropic-ai\/|@openai\/codex)/.test(name)) delete pkg[group][name];
      }
    }
    delete pkg.copilotRuntimeVersion;
    return JSON.stringify(pkg, null, 2) + '\n';
  });
}

// Follow-ups found by typechecking the resolved tree.
edit('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', s => {
  s = replace(s, "import { type IAgentHostRestrictedTelemetryContext } from './agentHostRestrictedTelemetry.js';",
    "import { multiplexProperties, type IAgentHostRestrictedTelemetry, type IAgentHostRestrictedTelemetryContext } from './agentHostRestrictedTelemetry.js';");
  s = replace(s, ', type ICodexAccountTelemetryContext', '');
  return s;
});
// VSCodium's policy-watcher fork passes the vendor name first; 1.142 added a test using the 3-argument factory.
edit('src/vs/platform/policy/test/node/nativeManagedSettingsService.test.ts', s => replace(s,
  "'com.github.copilot', undefined, (_name, policies, callback) => {", "'com.github.copilot', undefined, (_vendorName, _name, policies, callback) => {"));
