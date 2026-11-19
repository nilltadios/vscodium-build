// Version-specific resolutions for porting the VSCodium ca7f7b4 lineage (local 1.146.00001) to VS Code 1.147.0.
// "ours" is the 1.146.0 port; port-rules.mjs runs afterwards for the recurring parts (agent SDKs, forks,
// pnpm allowBuilds, removed workspace packages, copilot SKU telemetry).
import { edit, replace, resolve } from './port-lib.mjs';

const both = (ours, theirs) => ours + theirs;

// VSCodium removes vsda (proprietary signing WASM); drop upstream's vsdaWeb declarations and constants.
resolve('src/vs/platform/sign/browser/signService.ts', ['ours']);

// Custom-font import next to 1.147's structural-diff imports.
resolve('src/vs/workbench/contrib/scm/browser/scmViewPane.ts', [both]);

// 1.147 hoisted singleArchFiles/x64ArchFiles to top-level constants; port-rules.mjs rewrites os-proxy-resolver.
resolve('build/darwin/create-universal-app.ts', ['theirs']);

// Keep 1.147's `{ dot: true }` filter option without Copilot runtime prebuilds or exclude filters.
resolve('build/gulpfile.vscode.ts', [(_, theirs) =>
  replace(theirs,
    'es.merge(cleanedDeps, copilotRuntimePrebuilds, osProxyResolverPlatformPackage)',
    'es.merge(cleanedDeps, osProxyResolverPlatformPackage)')
    .split('\n').filter(l => !/getCopilot(?:Tgrep)?ExcludeFilter/.test(l)).join('\n')]);

// 1.147 merged extensions into the root pnpm workspace, dropping 'extensions' from separateRoots.
resolve('build/npm/dirs.ts', ['theirs']);

// Copilot utility-model helpers removed with copilotApiService.ts.
resolve('src/vs/platform/agentHost/node/agentHostPullRequestOperationHandler.ts', ['ours']);
resolve('src/vs/platform/agentHost/node/shared/agentBranchNameGenerator.ts', ['ours']);
resolve('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', ['ours']);
resolve('src/vs/platform/agentHost/node/agentHostUtilityModelService.ts', ['ours', 'ours']);

// Keep WebSocketProtocolServer next to 1.147's localProcessPathStyle import.
resolve('src/vs/platform/agentHost/node/agentHostServerMain.ts', [both]);

// Agent host main: keep 1.147's endpoint-registry / exit-heartbeat diagnostics imports and setup,
// without registering Copilot/Claude/Codex providers (which VSCodium removes).
resolve('src/vs/platform/agentHost/node/agentHostMain.ts', [
  () =>
    "import { AgentHostIpcChannels, AgentHostMainProcessConnectionContext, IAgentHostInspectInfo, IAgentHostSocketInfo, IConnectionTrackerService } from '../common/agentService.js';\n" +
    "import { AGENT_HOST_ENDPOINT_REGISTRY_SCHEMA_VERSION, IAgentHostEndpointMetadata } from '../common/agentHostEndpointRegistry.js';\n" +
    "import { PROTOCOL_VERSION } from '../common/state/protocol/version/registry.js';\n",
  () => "import { IAgentHostClientConnectionService } from './agentHostClientConnectionService.js';\n",
  (_, theirs) => theirs.slice(0, theirs.indexOf('\t\tproviderService.registerProvider(')),
]);

// Telemetry reporter: take 1.147's AgentCanvasOpenFailure import (drop isReasoningEffortLevel, only used by the
// stubbed turnHung); keep turnHung stubbed.
resolve('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', [
  (_, theirs) => replace(theirs, "import { isReasoningEffortLevel } from '../common/reasoningEffort.js';\n", ''),
  'ours',
]);

// 1.147 registered CopilotAccountService from agentHost/node/copilot/, which VSCodium deletes.
edit('src/vs/platform/agentHost/node/agentHostServices.ts', s =>
  replace(
    replace(s, "import { CopilotAccountService, ICopilotAccountService } from './copilot/copilotAccountService.js';\n", ''),
    '\tservices.set(ICopilotAccountService, new SyncDescriptor(CopilotAccountService));\n',
    ''
  ));

// Custom-font patch replaces ExplorerDelegate.ITEM_HEIGHT with ExplorerDelegate.getHeight().
edit('src/vs/sessions/contrib/files/browser/filesView.ts', s =>
  replace(s, 'ExplorerDelegate.ITEM_HEIGHT', 'ExplorerDelegate.getHeight()'));
