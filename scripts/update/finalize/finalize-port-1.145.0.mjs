// Version-specific resolutions for porting the VSCodium ca7f7b4 lineage (local 1.144.00002) to VS Code 1.145.0.
// "ours" is the 1.144 port; port-rules.mjs runs afterwards for the recurring parts.
import { edit, replace, resolve } from './port-lib.mjs';

// 1.145 deletes SetupTool (the "New Workspace" setup tool) upstream; our branded registration goes with it.
resolve('src/vs/workbench/contrib/chat/browser/chatSetup/chatSetupProviders.ts', ['theirs']);

// VSCodium removes the "Open Tunnel..." start entry; 1.145 only edited its `when`.
resolve('src/vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent.ts', ['ours']);

// Tab fonts: our port's configurationService and 1.145's new modelService are both base-constructor parameters.
resolve('src/vs/workbench/browser/parts/editor/editorTabsControl.ts', [(ours, theirs) => ours + theirs]);
resolve('src/vs/workbench/browser/parts/editor/multiEditorTabsControl.ts', [(ours, theirs) => {
  const [oursParam] = ours.split('\n');
  return oursParam + '\n' + theirs.replace('menuService, modelService);', 'menuService, configurationService, modelService);');
}]);

// Sessions test: 1.145's store-based cleanup, with our font patch's row height (notificationsViewer no longer
// exports DEFAULT_NOTIFICATION_ROW_HEIGHT). The NullTelemetryServiceShape import lost its last user upstream.
const sessionsTest = 'src/vs/sessions/test/browser/workbench.test.ts';
resolve(sessionsTest, [
  ours => ours.split('\n')[0] + '\n',
  (_, theirs) => theirs.replace('DEFAULT_NOTIFICATION_ROW_HEIGHT', 'FONT.sidebarSize42'),
  'theirs']);
edit(sessionsTest, s => replace(s, 'store.add(toDisposable(() => setNotificationRowHeight(DEFAULT_NOTIFICATION_ROW_HEIGHT)));',
  'store.add(toDisposable(() => setNotificationRowHeight(FONT.sidebarSize42)));'));

// Agent host server: keep 1.145's graceful-shutdown timeout; the Claude/Codex SDK-root overrides stay out with
// the SDKs VSCodium removes.
const fromShutdown = text => text.slice(text.indexOf('\t/**\n\t * How long a graceful shutdown'));
resolve('src/vs/platform/agentHost/node/agentHostServerMain.ts', [
  (_, theirs) => fromShutdown(theirs),
  (_, theirs) => theirs.slice(theirs.indexOf('\tconst shutdownTimeout = ')),
  () => '\treturn { port, host, enableMockAgent, shutdownTimeoutMs, quiet, connectionToken };\n']);

// Telemetry reporter: VSCodium's imports and stubbed bodies; take only 1.145's signatures (new optional
// sdkSessionId) so the callers still typecheck. 1.145's timing/Codex/SKU imports only feed removed telemetry.
const signatureOnly = (_, theirs) => theirs.split('\n')[0] + '\n';
resolve('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', ['ours', signatureOnly, signatureOnly, signatureOnly]);

// No utility-model chat completion / BYOK routing (VSCodium removed the Copilot API service it calls).
resolve('src/vs/platform/agentHost/node/agentHostUtilityModelService.ts', ['ours']);

// VSCodium's patch drops `const agentConfigurationService` with the Claude/Codex registration that used it;
// 1.145's multiple-chat-providers seed is its new user, so read it from the runtime services directly.
edit('src/vs/platform/agentHost/node/agentHostMain.ts', s => replace(s,
  'seedMultipleChatProvidersFromEnvironment(agentConfigurationService, process.env);',
  'seedMultipleChatProvidersFromEnvironment(runtimeServices.configurationService, process.env);'));
