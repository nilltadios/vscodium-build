// Version-specific resolutions for porting the 1.142.0 patch set to VS Code 1.143.1 (conflict picks and edits
// for what is new in 1.143). Run by port.sh after merge-from.sh and prune-providers.mjs; port-rules.mjs runs
// afterwards and handles the recurring parts (agent SDK removal, policy-watcher fork and its test factory,
// os-proxy-resolver globs).
import fs from 'node:fs';
import path from 'node:path';
import { edit, replace, dropLines, resolve, project, root } from './port-lib.mjs';

// Agent-host OTel service is removed (imports @github/copilot-sdk): strip its constructor argument and imports.
const noOtel = s => s.split('\n')
  .filter(l => l.trim() !== 'NullAgentHostOTelService,' && !/import .*(agentHostOTelService|IAgentHostFirstResponseDiagnostic)/.test(l))
  .join('\n').replaceAll(' NullAgentHostOTelService,', '');

// 43-arch-add-riscv64 adds a local riscv64 Node checksum; 1.143 bumps the other Node archives to 24.22.1.
resolve('build/checksums/nodejs.txt', [(ours, theirs) => {
  const riscv = ours.split('\n').find(l => l.includes('linux-riscv64'));
  return replace(theirs, '  node-v24.22.1-linux-x64.tar.gz\n', `  node-v24.22.1-linux-x64.tar.gz\n${riscv}\n`);
}]);

// 53-ext-copilot-remove-it: no Copilot runtime packaging, including 1.143's Windows copilot shim launcher.
resolve('build/gulpfile.vscode.ts', ['ours']);
edit('build/gulpfile.vscode.ts', s => {
  const a = s.indexOf('\t\t\t// Setup publishes it next to the copilot.exe shim');
  const b = s.indexOf("f.basename = 'copilot'; f.extname = ''; })));\n\n");
  if (a < 0 || b < a) throw new Error('copilot shim block not found');
  return s.slice(0, a) + s.slice(b + "f.basename = 'copilot'; f.extname = ''; })));\n\n".length);
});

// 1.143 removed the Copilot semantic-search setting (the port only rebranded its description).
resolve('src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts', ['theirs']);

// 1.143 moved terminal tab renaming to InlineEditInputBox; keep 00-ui-custom-font's row height.
resolve('src/vs/workbench/contrib/terminal/browser/terminalTabsList.ts', [(_, theirs) =>
  '\t\tinputBox.element.style.height = `${FONT.bottomPaneSize22}px`;\n\n' + theirs]);

// Provider agents (Copilot/Claude/Codex SDKs) are removed: keep the port's import lists.
resolve('src/vs/platform/agentHost/node/agentHostMain.ts', ['ours']);
resolve('src/vs/platform/agentHost/node/agentHostServerMain.ts', [(_, theirs) =>
  theirs.split('\n').filter(l => !/from '\.\/(copilot|claude|codex)\//.test(l)).join('\n')]);

// Session titles: keep the port's deterministic fallback titles (no utility-model or GitHub-context generation).
resolve('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', ['ours', 'ours', 'ours']);

// Customization discovery runs through the Copilot SDK client: keep the port's watcher-only stub.
resolve('src/vs/platform/agentHost/node/copilot/sessionCustomizationDiscovery.ts', ['ours', 'ours', 'ours']);

// Mock agent: 1.143's steering API, without the removed history-record fixtures (they import Copilot test events).
resolve('src/vs/platform/agentHost/test/node/mockAgent.ts', [
  (_, theirs) => dropLines(theirs, 'historyRecordFixtures.js'),
  (_, theirs) => theirs.slice(0, theirs.indexOf('\tasync getSessionMessages(')),
  'ours']);

// Telemetry reporter: keep 1.143's events (inert while telemetry is disabled) minus Codex fields and OTel timing.
resolve('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', [
  (_, theirs) => dropLines(theirs, 'agentHostOTelService.js'),
  (ours, theirs) => ours + dropLines(theirs, 'IAgentHostTurnCompletedEvent extends', 'codexModelProvider?:'),
  (ours, theirs) => ours + dropLines(theirs, 'IAgentHostTurnCompletedClassification =', 'codexModelProvider?:'),
  (_, theirs) => {
    const a = theirs.indexOf('\t\tthis._otelService?.emitTurnTiming({');
    const b = theirs.indexOf('\t\tthis._telemetryService.publicLog2');
    return dropLines(theirs.slice(0, a) + theirs.slice(b), 'getCodexAccountTelemetryData(', 'codexModelProvider: report.codexModelProvider');
  }]);

resolve('src/vs/platform/agentHost/node/agentService.ts', ['theirs', (_, theirs) => dropLines(theirs, 'IAgentHostOTelService')]);
resolve('src/vs/platform/agentHost/node/protocolServerHandler.ts', [
  (_, theirs) => dropLines(theirs, 'agentHostOTelService', 'agentHostFirstResponseValidator', 'chatUserInteraction.js'),
  (_, theirs) => dropLines(theirs, '_otelService'),
  (_, theirs) => replace(theirs, 'this._otelService?.diagnosticsEnabled', 'false')]);

// Tests: drop the OTel argument everywhere and the two OTel bridge tests 1.143 added.
const otelTests = ["\ttest('first-response diagnostics are opt-in", "\ttest('UI timing bridge allowlists payloads"];
resolve('src/vs/platform/agentHost/test/node/protocolServerHandler.test.ts', Array.from({ length: 31 }, (_, i) => (_, theirs) => {
  if (i !== 3) return noOtel(theirs);
  let s = theirs;
  for (const start of otelTests) {
    const a = s.indexOf(start);
    const b = s.indexOf('\n\ttest(', a + 1);
    if (a < 0 || b < 0) throw new Error(`test not found: ${start}`);
    s = s.slice(0, a) + s.slice(b + 1);
  }
  return noOtel(s);
}));
edit('src/vs/platform/agentHost/test/node/protocolServerHandler.test.ts', s => noOtel(s));

// Follow-ups found by typechecking the resolved tree.
// Discovery: 1.143's trigger-precise watchers only serve the removed SDK discovery; reuse the previous stub verbatim
// (workspaceDirectoryHasHooks is unchanged upstream).
const prevTree = path.join(project, JSON.parse(fs.readFileSync(path.join(project, 'port.json'), 'utf8')).from_dir);
const prevRoot = path.join(fs.readFileSync(path.join(prevTree, 'work/latest-path.txt'), 'utf8').trim(), 'vscode');
edit('src/vs/platform/agentHost/node/copilot/sessionCustomizationDiscovery.ts', () =>
  fs.readFileSync(path.join(prevRoot, 'src/vs/platform/agentHost/node/copilot/sessionCustomizationDiscovery.ts'), 'utf8'));

edit('src/vs/platform/agentHost/node/agentHostServerMain.ts', s => replace(s, ', type IAgentSdkDownloadProgress', ''));
edit('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', s => replace(s, ' persistSessionMetadata,', ''));
edit('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', s => replace(s, 'import { getAgentHostChatId, isSubagentSession,', 'import { isSubagentSession,'));
edit('src/vs/platform/agentHost/node/agentService.ts', s => replace(s, ' readSessionComparisonMetadata,', ''));
edit('src/vs/platform/agentHost/test/node/mockAgent.ts', s => replace(s, ' parseSubagentSessionUri,', ''));

// 1.143 saved chats: the Claude and Codex readers are removed with their SDKs, so no provider has saved chats.
edit('src/vs/platform/agentHost/node/agentServiceComposition.ts', s => {
  s = dropLines(s, "from './claude/claudeSavedChatReader.js'", "from './codex/codexSavedChatReader.js'",
    'instantiationService.createInstance(ClaudeSavedChatReader)', 'instantiationService.createInstance(CodexSavedChatReader)');
  s = replace(s, 'new Map<AgentProvider, IAgentHostSavedChatReader>([\n\t\t\t]),', 'new Map<AgentProvider, IAgentHostSavedChatReader>(),');
  return replace(s, 'import { CLAUDE_AGENT_PROVIDER_ID, CODEX_AGENT_PROVIDER_ID, type AgentProvider,', 'import { type AgentProvider,');
});

// 1.143's on-device model bridge serves only the removed Copilot agent: no setup service or channel.
fs.unlinkSync(path.join(root, 'src/vs/platform/agentHost/node/localModelSetupChannel.ts'));
edit('src/vs/platform/agentHost/node/agentHostServices.ts', s => {
  s = dropLines(s, "from './copilot/localModelBridge/localModelSetupService.js'");
  return replace(s, "\tservices.set(\n\t\tILocalModelSetupService,\n\t\tinputs.localModel?.kind === 'localUtilityProcess' ? new SyncDescriptor(LocalModelSetupService) : new NullLocalModelSetupService(),\n\t);\n", '');
});

// Test utilities: no Claude SDK service to stub.
edit('src/vs/platform/agentHost/test/node/agentServiceTestUtils.ts', s => dropLines(s,
  "from '../../node/claude/claudeAgentSdkService.js'", 'claudeSdkService?: IClaudeAgentSdkService,', 'services.set(IClaudeAgentSdkService,'));
// This compatibility-restore test replays history-record fixtures (removed: they import Copilot test events).
edit('src/vs/platform/agentHost/test/node/sessionStorageIdentity.test.ts', s => {
  const a = s.indexOf("\t\ttest('restoring a compatibility session registers its subagent chat in memory");
  const b = s.indexOf('\n\t\t});\n', a);
  if (a < 0 || b < 0) throw new Error('compatibility-restore test not found');
  s = s.slice(0, a).replace(/\n+$/, '\n') + s.slice(b + '\n\t\t});\n'.length);
  return replace(s, 'import { DeferredPromise, timeout } from', 'import { DeferredPromise } from');
});
