// Version-specific resolutions for porting the 1.141.2 patch set to VS Code 1.142.0 (conflict picks and edits
// for what is new in 1.142). Run by port.sh after merge-from.sh and prune-providers.mjs; port-rules.mjs runs
// afterwards and handles the recurring parts (agent SDK removal, policy-watcher fork and its test factory,
// os-proxy-resolver globs). Derived from versions/1.142.0/scripts/finalize-port-1.142.0.mjs.
import { edit, replace, dropLines, resolve, replaceAll } from './port-lib.mjs';

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

// 1.142's macOS globs (the mxc-sdk entries were removed upstream); port-rules.mjs renames the proxy resolver.
resolve('build/darwin/create-universal-app.ts', ['theirs']);

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

// Follow-ups found by typechecking the resolved tree.
edit('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', s => {
  s = replace(s, "import { type IAgentHostRestrictedTelemetryContext } from './agentHostRestrictedTelemetry.js';",
    "import { multiplexProperties, type IAgentHostRestrictedTelemetry, type IAgentHostRestrictedTelemetryContext } from './agentHostRestrictedTelemetry.js';");
  s = replace(s, ', type ICodexAccountTelemetryContext', '');
  return s;
});
