// Version-specific resolutions for porting the VSCodium ca7f7b4 lineage (local 1.147.00001) to VS Code 1.148.0.
// "ours" is the 1.147.0 port; port-rules.mjs runs afterwards for the recurring parts (agent SDKs, forks,
// pnpm allowBuilds, removed workspace packages, copilot SKU telemetry).
import { edit, replace, replaceAll, resolve } from './port-lib.mjs';

const both = (ours, theirs) => ours + theirs;

// Custom-font sidebar rules (ours) plus 1.148's sessions-only rule.
resolve('src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/media/chatViewPane.css', [both]);

// 1.148 moved the dispose() resets under `!willShutdown`; keep the custom-font sizes there.
resolve('src/vs/workbench/contrib/modernUI/browser/modernUI.contribution.ts', ['theirs']);
edit('src/vs/workbench/contrib/modernUI/browser/modernUI.contribution.ts', s =>
  replace(replace(s,
    '\t\t\tsetNotificationRowHeight(DEFAULT_NOTIFICATION_ROW_HEIGHT);\n',
    '\t\t\tsetNotificationRowHeight(FONT.sidebarSize42);\n'),
    '\t\t\tsetGlobalPaneHeaderSize(DEFAULT_PANE_HEADER_SIZE);\n',
    '\t\t\tsetGlobalPaneHeaderSize(FONT.sidebarSize22);\n'));

// 1.148 replaced event-stream with build/lib/streams.ts and added the .vscodeignore filter; keep @vscodium/vsce.
const vscodiumVsce = (_, theirs) => replaceAll(theirs, '@vscode/vsce', '@vscodium/vsce', 2);
resolve('build/lib/extensions.ts', [vscodiumVsce, vscodiumVsce]);

// VSCodium's own update check (latest.json) on top of 1.148's IDarwinUpdateHost abstraction.
resolve('src/vs/platform/update/electron-main/updateService.darwin.ts', [
  'ours',
  ours => replace(ours,
    '\t\t\t\t\telectron.autoUpdater.setFeedURL({ url });\n\t\t\t\t\telectron.autoUpdater.checkForUpdates();\n',
    '\t\t\t\t\ttry {\n' +
    '\t\t\t\t\t\tthis.host.registerEarlyStaging(this.isEarlyStagingEnabled());\n' +
    '\t\t\t\t\t} catch (e) {\n' +
    "\t\t\t\t\t\tthis.logService.error('Failed to update SquirrelMacEnableEarlyStaging default', e);\n" +
    '\t\t\t\t\t}\n' +
    '\t\t\t\t\tthis.host.setFeedURL(url, undefined);\n' +
    '\t\t\t\t\tthis.host.checkForUpdates();\n'),
]);

// No Copilot runtime prebuilds in the remote server; 1.148 uses streams.ts merge().
resolve('build/gulpfile.reh.ts', [() => '\t\tconst deps = merge(cleanedDeps)\n']);

// No Copilot runtime check/version stamping, prebuilds, SDK asar exclusions or copilot shim (VSCodium removes
// Copilot); es.merge -> streams.ts merge() as in the rest of 1.148's file.
const esMerge = ours => replace(ours, 'es.merge(', 'merge(');
resolve('build/gulpfile.vscode.ts', ['ours', 'ours', esMerge, 'ours', esMerge]);

// About dialog and product.ts without Copilot versions (VSCodium removes Copilot).
resolve('src/vs/platform/dialogs/electron-browser/dialog.ts', ['ours']);
resolve('src/vs/platform/product/common/product.ts', ['ours']);

// VSCodium searches its own GitHub issues instead of the Microsoft duplicate-candidates service.
resolve('src/vs/workbench/contrib/issue/browser/baseIssueReporterService.ts', ['ours']);

// VSCodium's CLI update endpoints (latest.json, GitHub release downloads); upstream only dropped a `&`.
resolve('cli/src/update_service.rs', ['ours', 'ours', 'ours']);

// Copilot utility-model helpers removed with copilotApiService.ts (1.148 moved them from AbortSignal to
// CancellationToken; nothing of that survives the removal).
// Import blocks: 1.148 reordered them, so take its blocks whole and drop what the removal leaves unused.
// 1.148's PR autopilot option and outcome type stay; its generation-context size limits go with the generation.
resolve('src/vs/platform/agentHost/node/agentHostPullRequestOperationHandler.ts', [
  'theirs', 'theirs',
  (_, theirs) => theirs.slice(theirs.indexOf('type PullRequestCreationConfiguration')),
  'ours', 'ours', 'ours',
]);
edit('src/vs/platform/agentHost/node/agentHostPullRequestOperationHandler.ts', s => [
  ["import { buildConversationContext } from '../common/agentHostConversationContext.js';\n", ''],
  ['type ChangesetOperationFollowUp, type ISessionFileDiff, type ISessionWithDefaultChat', 'type ChangesetOperationFollowUp, type ISessionWithDefaultChat'],
  ["import { AgentHostUtilityModelUnavailableError, AgentHostUtilityModelUnavailableReason, IAgentHostUtilityModelService, type IAgentHostUtilityModelContext } from './agentHostUtilityModelService.js';\n", ''],
  ["import { type ICopilotUtilityChatMessage } from './shared/copilotApiService.js';\n", ''],
].reduce((t, [a, b]) => replace(t, a, b), s));
// 1.148's request interface takes a CancellationToken.
resolve('src/vs/platform/agentHost/node/shared/agentBranchNameGenerator.ts', [
  () => "import { CancellationToken } from '../../../../base/common/cancellation.js';\n",
  'ours',
]);
resolve('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', ['theirs', 'theirs', 'theirs', 'ours']);
edit('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', s => [
  ["import { disposableTimeout } from '../../../base/common/async.js';\n", ''],
  ['import { CancellationToken, CancellationTokenSource }', 'import { CancellationTokenSource }'],
  ['import { Disposable, DisposableStore }', 'import { Disposable }'],
  ['import { buildConversationContext, renderResponseMarkdown, truncateMiddle }', 'import { buildConversationContext, truncateMiddle }'],
  ['import { TurnState, isAhpChatChannel,', 'import { isAhpChatChannel,'],
  ['import { AgentHostUtilityModelUnavailableError, type IAgentHostUtilityModelContext, type IAgentHostUtilityModelService }', 'import { type IAgentHostUtilityModelService }'],
  ["import { type ICopilotUtilityChatMessage } from './shared/copilotApiService.js';\n", ''],
].reduce((t, [a, b]) => replace(t, a, b), s));
resolve('src/vs/platform/agentHost/node/agentHostUtilityModelService.ts', ['ours', 'ours', 'ours']);
// Its request options extend the removed Copilot API service's options; nothing calls chatCompletion any more.
edit('src/vs/platform/agentHost/node/agentHostUtilityModelService.ts', s => replace(s,
  "export interface IAgentHostUtilityModelRequestOptions extends Omit<ICopilotApiServiceRequestOptions, 'signal'> {\n\treadonly cancellationToken?: CancellationToken;\n}\n\n", ''));

// 1.148's Copilot built-in skills provider lives in agentHost/node/copilot/, which VSCodium deletes.
edit('src/vs/platform/agentHost/node/agentHostContributions.ts', s => [
  "import { AGENT_BUILTIN_CUSTOMIZATION_SCHEME, AGENT_BUILTIN_SKILL_SCHEME } from '../common/agentHostCustomizationUri.js';\n",
  "import { IAgentHostResourceProviders } from './agentHostResourceProviders.js';\n",
  "import { CopilotBuiltinSkillResourceProvider } from './copilot/copilotBuiltinSkills.js';\n",
  '\t\tconst resources = accessor.get(IAgentHostResourceProviders);\n',
  '\t\tconst builtinSkills = new CopilotBuiltinSkillResourceProvider();\n',
  '\t\tstore.add(resources.registerProvider(AGENT_BUILTIN_SKILL_SCHEME, builtinSkills));\n',
  '\t\tstore.add(resources.registerProvider(AGENT_BUILTIN_CUSTOMIZATION_SCHEME, builtinSkills));\n',
].reduce((t, line) => replace(t, line, ''), s));
edit('src/vs/platform/agentHost/node/protocolServerHandler.ts', s => replace(replace(s,
  "import { getCopilotBuiltinSkillSource } from './copilot/copilotBuiltinSkills.js';\n", ''),
  "\t\t\tif (method === 'resourceRead' && typeof value === 'string' && getCopilotBuiltinSkillSource(URI.parse(value, true)) !== undefined) {\n\t\t\t\tcontinue;\n\t\t\t}\n", ''));

// The duplicate-candidates search that used these is removed (VSCodium searches its GitHub issues).
edit('src/vs/workbench/contrib/issue/browser/baseIssueReporterService.ts', s => replace(replace(s,
  'import { Disposable, DisposableStore, MutableDisposable, toDisposable }', 'import { Disposable, MutableDisposable, toDisposable }'),
  "import { createCancellableFetch } from '../../../../base/parts/request/common/fetch.js';\n", ''));

// New 1.148 test teardown: the custom-font patch replaces the default size constants with FONT sizes.
edit('src/vs/workbench/contrib/modernUI/test/browser/modernUI.contribution.test.ts', s => [
  ['import { DEFAULT_PANE_HEADER_SIZE, Pane, setGlobalPaneHeaderSize }', 'import { Pane, setGlobalPaneHeaderSize }'],
  ['import { DEFAULT_NOTIFICATION_ROW_HEIGHT, onDidChangeNotificationRowHeight, setNotificationRowHeight }', 'import { onDidChangeNotificationRowHeight, setNotificationRowHeight }'],
  ['\t\t\tsetNotificationRowHeight(DEFAULT_NOTIFICATION_ROW_HEIGHT);\n\t\t\tsetGlobalPaneHeaderSize(DEFAULT_PANE_HEADER_SIZE);\n',
    '\t\t\tsetNotificationRowHeight(FONT.sidebarSize42);\n\t\t\tsetGlobalPaneHeaderSize(FONT.sidebarSize22);\n'],
].reduce((t, [a, b]) => replace(t, a, b), s).replace(/^(import [^\n]*\n)(?!import)/m, "$1import { FONT } from '../../../../../base/common/font.js';\n"));

// 1.148 stubs the chat view sessions list service from contrib/chat/test, which VSCodium deletes.
edit('src/vs/workbench/test/browser/workbenchTestServices.ts', s => replace(replace(s,
  "import { stubChatViewSessionsListService } from '../../contrib/chat/test/common/chatViewSessionsListServiceTestUtils.js';\n", ''),
  '\tstubChatViewSessionsListService(instantiationService);\n', ''));

// Telemetry reporter: 1.148's agent.js import without isReasoningEffortLevel (only the stubbed turnHung used it);
// turnCompleted classification fields without the removed Codex account classification; keep the new
// modelCallUsageCounted types but not the stubbed requestTokenUsage ones; 1.148's modelMessageText signature,
// still stubbed; turnCompleted stays stubbed.
resolve('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', [
  (_, theirs) => replace(theirs, "import { isReasoningEffortLevel } from '../common/reasoningEffort.js';\n", ''),
  (ours, theirs) => ours + theirs.slice(theirs.indexOf('\n') + 1),
  (_, theirs) => theirs.slice(0, theirs.indexOf('interface IRequestTokenUsageEvent')),
  'ours',
  (_, theirs) => theirs.slice(0, theirs.indexOf('\n') + 1),
  'ours',
]);
