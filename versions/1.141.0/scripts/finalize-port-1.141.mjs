// Manual 1.141.0 resolutions for hunks port-rejects.mjs could not place; run once after prune-providers.mjs.
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
  if (!s.includes(old) || s.indexOf(old) !== s.lastIndexOf(old)) throw new Error(`Missing or ambiguous: ${old}`);
  return s.replace(old, fresh);
};
const removeBlock = (s, first, last) => {
  const a = s.indexOf(first), b = s.indexOf(last, a + first.length);
  if (a < 0 || b < 0) throw new Error(`Missing block: ${first}`);
  return s.slice(0, a) + s.slice(b);
};

// Branding: the policy report heading moved to its own module in 1.141.
edit('src/vs/workbench/browser/actions/policyDiagnosticsMarkdown.ts', s => replace(s, "'# VS Code Policy Diagnostics\\n\\n'", "'# VSCodium Policy Diagnostics\\n\\n'"));
edit('src/vs/workbench/test/browser/actions/policyDiagnosticsMarkdown.test.ts', s => replace(s, "'# VS Code Policy Diagnostics\\n\\n", "'# VSCodium Policy Diagnostics\\n\\n"));

// Hide the accounts-menu Copilot sign-in when AI features are disabled; the shared condition is now a tested constant.
edit('src/vs/workbench/contrib/chat/browser/chatSetup/chatSetupContributions.ts', s => replace(s,
  '\t\t\t\t\t\twhen: ChatSetupFromAccountsWhen,',
  "\t\t\t\t\t\twhen: ContextKeyExpr.and(ContextKeyExpr.has('config.chat.disableAIFeatures').negate(), ChatSetupFromAccountsWhen),"));

// Issue reporter: search VSCodium's GitHub issues instead of posting drafts to Microsoft's duplicate service.
edit('src/vs/workbench/contrib/issue/browser/baseIssueReporterService.ts', s => {
  s = replace(s, '\t\t\tthis.searchDuplicates(title, issueDescription, this.similarIssueSearchGeneration);',
    "\t\t\tthis.searchGitHub('VSCodium/vscodium', title, this.similarIssueSearchGeneration);");
  s = replace(s, '\t\tconst description = this.issueReporterModel.getData().issueDescription;\n\t\tthis.searchDuplicates(title, description, this.similarIssueSearchGeneration);',
    "\t\tthis.searchGitHub('VSCodium/vscodium', title, this.similarIssueSearchGeneration);");
  return removeBlock(s, '\t@debounce(300)\n\tprivate searchDuplicates(', '\tprivate displaySearchResults(');
});

// Title generation used the Copilot API; keep the deterministic fallback titles only.
edit('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', s => {
  const start = '\tprivate async _generateTitleFromPrompt(prompt: ITitlePromptContext, token: CancellationToken): Promise<string | undefined> {\n';
  s = removeBlock(s, start, '\t/**\n\t * Builds the first-turn context string');
  s = replace(s, '\t/**\n\t * Builds the first-turn context string', `${start}\t\treturn undefined;\n\t}\n\n\t/**\n\t * Builds the first-turn context string`);
  return s;
});

// Bundled Claude/Codex SDK services and their SDK telemetry are not shipped.
edit('src/vs/platform/agentHost/node/agentHostServices.ts', s => {
  for (const line of [
    '\tservices.set(IClaudeAgentSdkService, new SyncDescriptor(ClaudeAgentSdkService));\n',
    '\tservices.set(IClaudeProxyService, new SyncDescriptor(ClaudeProxyService));\n',
    '\tservices.set(ICodexProxyService, new SyncDescriptor(CodexProxyService, [undefined]));\n',
    '\tservices.set(IAgentHostOTelService, new SyncDescriptor(AgentHostOTelService, [{ fetchFn: inputs.fetchFn }]));\n',
  ]) {
    s = replace(s, line, '');
  }
  return s.split('\n').filter(l => !/^import .*(?:claudeAgentSdkService|claudeProxyService|codexProxyService|otel\/agentHostOTelService)\.js';$/.test(l)).join('\n');
});

// In 1.141 nearly every sandbox test projects policy through the removed Copilot SDK module.
fs.rmSync(path.join(root, 'src/vs/platform/agentHost/test/node/sessionSandbox.test.ts'), { force: true });
console.log('Removed sessionSandbox.test.ts (depends on removed copilotSandboxPolicy.ts)');

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

// 1.141's automation customizations reuse one SDK-independent helper from the removed Copilot converter module.
edit('src/vs/platform/agentHost/node/agentHostAutomationCustomizations.ts', s => {
  s = replace(s, "import { CustomizationLoadStatus, CustomizationType, type AgentSelection, type ClientPluginCustomization, type PluginCustomization, type SessionActiveClient } from '../common/state/sessionState.js';\nimport { toChildCustomizations } from './copilot/copilotPluginConverters.js';\n",
    "import { CustomizationLoadStatus, CustomizationType, type AgentSelection, type ChildCustomization, type ClientPluginCustomization, type PluginCustomization, type SessionActiveClient } from '../common/state/sessionState.js';\nimport type { IParsedPlugin } from '../../agentPlugins/common/pluginParsers.js';\n");
  return replace(s, '\n\n/** Captures automation plugins as host paths', `
/** Collects each child customization produced by parsed plugins, deduped by id. */
function toChildCustomizations(plugins: readonly IParsedPlugin[]): ChildCustomization[] {
\tconst byId = new Map<string, ChildCustomization>();
\tconst add = (c: ChildCustomization) => {
\t\tif (!byId.has(c.id)) {
\t\t\tbyId.set(c.id, c);
\t\t}
\t};
\tfor (const plugin of plugins) {
\t\tfor (const a of plugin.agents) { add(a.customization); }
\t\tfor (const s of plugin.skills) { add(s.customization); }
\t\tfor (const r of plugin.instructions) { add(r.customization); }
\t\tfor (const h of plugin.hooks) { add(h.customization); }
\t\tfor (const m of plugin.mcpServers) { add(m.customization); }
\t}
\treturn [...byId.values()];
}

/** Captures automation plugins as host paths`);
});
// Display helper for the removed Copilot slash-command runtime; no remaining importers.
fs.rmSync(path.join(root, 'src/vs/platform/agentHost/node/copilot/copilotSandboxPolicyDisplay.ts'));
console.log('Removed copilotSandboxPolicyDisplay.ts');
