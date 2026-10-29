// Manual resolutions for VSCodium be70704 patches (written for VS Code 1.140.0) on VS Code 1.141.2.
// Run once on a fresh port-patches.sh tree, after port-rejects.mjs and prune-providers.mjs.
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
const replaceAll = (s, old, fresh, count) => {
  const found = s.split(old).length - 1;
  if (found !== count) throw new Error(`Expected ${count} of ${old}, found ${found}`);
  return s.split(old).join(fresh);
};
const removeBlock = (s, first, last) => {
  const a = s.indexOf(first), b = s.indexOf(last, a + first.length);
  if (a < 0 || b < 0) throw new Error(`Missing block: ${first}`);
  return s.slice(0, a) + s.slice(b);
};

// Branding: the policy report heading moved to its own module in 1.141.
edit('src/vs/workbench/browser/actions/policyDiagnosticsMarkdown.ts', s => replace(s, "'# VS Code Policy Diagnostics\\n\\n'", "'# VSCodium Policy Diagnostics\\n\\n'"));
edit('src/vs/workbench/test/browser/actions/policyDiagnosticsMarkdown.test.ts', s => replace(s, "'# VS Code Policy Diagnostics\\n\\n", "'# VSCodium Policy Diagnostics\\n\\n"));
// Branding: the agent network-domain settings moved to chatNetworkConfiguration.ts in 1.141.
edit('src/vs/workbench/contrib/chat/browser/chatNetworkConfiguration.ts', s => replaceAll(s, 'until VS Code is restarted.', 'until VSCodium is restarted.', 4));

// Hide the accounts-menu Copilot sign-in when AI features are disabled; the shared condition is now a tested constant.
edit('src/vs/workbench/contrib/chat/browser/chatSetup/chatSetupContributions.ts', s => replace(s,
  '\t\t\t\t\t\twhen: ChatSetupFromAccountsWhen,',
  "\t\t\t\t\t\twhen: ContextKeyExpr.and(ContextKeyExpr.has('config.chat.disableAIFeatures').negate(), ChatSetupFromAccountsWhen),"));

// 00-ui-custom-font: tests that now use FONT need its import (the import context moved).
edit('src/vs/sessions/test/browser/workbench.test.ts', s => replace(s,
  "import { EditorInput } from '../../../workbench/common/editor/editorInput.js';\n",
  "import { EditorInput } from '../../../workbench/common/editor/editorInput.js';\nimport { FONT } from '../../../base/common/font.js';\n"));
edit('src/vs/workbench/test/browser/notificationsList.test.ts', s => replace(s,
  "import { Action, ActionRunner } from '../../../base/common/actions.js';\n",
  "import { Action, ActionRunner } from '../../../base/common/actions.js';\nimport { FONT } from '../../../base/common/font.js';\n"));
// 00-ui-custom-font replaces SELECT_OPTION_HEIGHT with the configurable sidebar size; 1.141 added another use.
edit('src/vs/base/browser/ui/selectBox/selectBoxCustom.ts', s => replace(s,
  '(this.selectBoxOptions.maxVisibleOptions ?? Infinity) * SELECT_OPTION_HEIGHT)', '(this.selectBoxOptions.maxVisibleOptions ?? Infinity) * FONT.sidebarSize22)'));

// Issue reporter: search VSCodium's GitHub issues instead of posting drafts to Microsoft's duplicate service.
edit('src/vs/workbench/contrib/issue/browser/baseIssueReporterService.ts', s => {
  s = replace(s, '\t\t\tthis.searchDuplicates(title, issueDescription, this.similarIssueSearchGeneration);',
    "\t\t\tthis.searchGitHub('VSCodium/vscodium', title, this.similarIssueSearchGeneration);");
  s = replace(s, '\t\tconst description = this.issueReporterModel.getData().issueDescription;\n\t\tthis.searchDuplicates(title, description, this.similarIssueSearchGeneration);',
    "\t\tthis.searchGitHub('VSCodium/vscodium', title, this.similarIssueSearchGeneration);");
  // Duplicate search was removed; keep the constructor parameter for subclasses and tests.
  s = replace(s, '\t\tprivate readonly fetcher: typeof fetch =', '\t\tprotected readonly fetcher: typeof fetch =');
  return removeBlock(s, '\t@debounce(300)\n\tprivate searchDuplicates(', '\tprivate displaySearchResults(');
});

// 22-osproxy-use-custom-lib: macOS universal-app globs (the line also lists new Copilot SDK packages).
edit('build/darwin/create-universal-app.ts', s => replaceAll(s, '@vscode/os-proxy-resolver-darwin-', '@vscodium/os-proxy-resolver-darwin-', 4));

// 53-ext-copilot-remove-it: dependency versions changed in 1.141, so remove the SDKs by name.
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

// Bundled Claude/Codex SDK services and agent-host OTel are not shipped (their modules are removed).
edit('src/vs/platform/agentHost/node/agentHostServices.ts', s => {
  for (const line of [
    '\tservices.set(IClaudeAgentSdkService, new SyncDescriptor(ClaudeAgentSdkService));\n',
    '\tservices.set(IClaudeProxyService, new SyncDescriptor(ClaudeProxyService));\n',
    '\tservices.set(ICodexProxyService, new SyncDescriptor(CodexProxyService, [undefined]));\n',
    '\tservices.set(IAgentHostOTelService, new SyncDescriptor(AgentHostOTelService, [{ fetchFn: inputs.fetchFn }]));\n',
  ]) {
    s = replace(s, line, '');
  }
  return s;
});
edit('src/vs/platform/agentHost/node/protocolServerHandler.ts', s => replace(s, '\t\t\t\t\tthis._otelService?.diagnosticsEnabled,\n', '\t\t\t\t\tfalse,\n'));
edit('src/vs/platform/agentHost/node/agentService.ts', s => {
  s = replace(s, "import { IAgentHostOTelService } from '../common/otel/agentHostOTelService.js';\n", '');
  s = replace(s, '\t\t@IAgentHostOTelService private readonly _otelService: IAgentHostOTelService,\n', '');
  s = replace(s, '\t\t\tthis._otelService.setSessionComparisonMetadata(config.session.toString(), readSessionComparisonMetadata(config._meta));\n', '');
  return replace(s, ' readSessionComparisonMetadata,', '');
});

// Title generation used the Copilot API; keep the deterministic fallback titles only (as in the 1.141.0 port).
edit('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', s => {
  const start = '\tprivate async _generateTitleFromPrompt(prompt: ITitlePromptContext, token: CancellationToken): Promise<string | undefined> {\n';
  s = removeBlock(s, start, '\t/**\n\t * Builds the first-turn context string');
  s = replace(s, '\t/**\n\t * Builds the first-turn context string', `${start}\t\treturn undefined;\n\t}\n\n\t/**\n\t * Builds the first-turn context string`);
  return s;
});

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

