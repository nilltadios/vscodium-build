// Version-specific resolutions for porting the VSCodium ca7f7b4 lineage (local 1.145.20001) to VS Code 1.146.0.
// "ours" is the 1.145.2 port; port-rules.mjs runs afterwards for the recurring parts (agent SDKs, forks,
// pnpm allowBuilds). 1.146 moved from npm to pnpm: package-lock.json/.npmrc are gone, lockfiles are
// pnpm-lock.yaml, and the Electron target lives in package.json `nativeBuild`.
import { edit, replace, resolve } from './port-lib.mjs';

// 1.146 removed the tool-search settings our branding hunk edited; take its new progress-updates setting.
resolve('src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts', ['theirs']);

// Import blocks: our custom-font imports next to 1.146's new ones.
const both = (ours, theirs) => ours + theirs;
resolve('src/vs/sessions/browser/workbench.ts', [both]);
resolve('src/vs/workbench/browser/parts/editor/multiEditorTabsControl.ts', [both]);
resolve('src/vs/workbench/contrib/extensions/browser/extensionsViewlet.ts', [both]);

// VSCodium's GitHub-release updater needs Architecture/Platform/Target and semver; 1.146 adds IQuitAndInstallOptions.
resolve('src/vs/platform/update/electron-main/abstractUpdateService.ts', [() =>
  "import { Architecture, AvailableForDownload, DisablementReason, IQuitAndInstallOptions, IUpdate, IUpdateService, Platform, State, StateType, Target, UpdateType } from '../common/update.js';\n" +
  "import * as semver from 'semver';\n"]);

// The proxy-resolver platform test now reads pnpm-lock.yaml; point its package names at VSCodium's fork.
const fork = (_, theirs) => theirs.replaceAll('@vscode\\/os-proxy-resolver-', '@vscodium\\/os-proxy-resolver-')
  .replaceAll("'@vscode/os-proxy-resolver-", "'@vscodium/os-proxy-resolver-");
resolve('build/lib/test/osProxyResolver.test.ts', [fork, fork]);

// Copilot runtime check and its pnpm-lock helper go with the Copilot SDK VSCodium removes.
resolve('build/gulpfile.vscode.ts', ['ours', 'ours']);

// postinstall: keep VSCodium's QEMU switch. 1.146 dropped the state files and the foundry loader patch, and
// VSCodium removes the Claude harness links, so nothing is left of the second hunk; its sides closed different
// blocks (our for loop, upstream's if), so drop the brace that only one side needed.
const postinstall = 'build/npm/postinstall.ts';
resolve(postinstall, ['ours', () => '']);
edit(postinstall, s => replace(s, '\tfinishCloudSandbox();\n\n\t}\n}\n', '\tfinishCloudSandbox();\n}\n'));

// Telemetry reporter: VSCodium's imports plus the prewarm reason type 1.146's interfaces use; no new
// provider-stage timing helpers (their callers are VSCodium-stubbed). The new skillInvoked event drops the
// Copilot SKU fields from copilotSkuTelemetry.ts, which VSCodium deletes (as in 1.145.2).
const reporter = 'src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts';
resolve(reporter, [ours => replace(ours, 'AgentHostTransportKind, type CodexModelProvider', 'AgentHostTransportKind, type AgentHostPrewarmSkipReason, type CodexModelProvider'), 'ours']);
edit(reporter, s => replace(s, '\t\t\t...toCopilotTelemetryData(report.telemetryContext),\n', ''));

// No utility-model chat completion / BYOK routing (VSCodium removed the Copilot API service it calls).
resolve('src/vs/platform/agentHost/node/agentHostUtilityModelService.ts', ['ours', 'ours']);

// 1.146 reads the Electron target from package.json `nativeBuild`; keep VSCodium's VSCODE_ELECTRON_VERSION override.
resolve('build/lib/electronVersion.ts', [(_, theirs) => replace(theirs,
  'return { electronVersion: config.target, msBuildId: config.msBuildId };',
  'return { electronVersion: process.env.VSCODE_ELECTRON_VERSION ?? config.target, msBuildId: config.msBuildId };')]);

// 1.146's import list (ModelSelection is used by its new routed-model helper).
resolve('src/vs/platform/agentHost/node/agentService.ts', ['theirs']);

// 1.146's server `--agent-host-ca` command installs the Copilot sandbox CA from agentHost/node/copilot/, which
// VSCodium deletes (52-ext-copilot-remove-it.json); without it the server falls through to its usual CLI/start.
edit('src/server-main.ts', s => replace(s, `if (parsedArgs['agent-host-ca'] !== undefined) {
	try {
		await bootstrapCode(nlsConfiguration);
		const { runAgentHostCertificateCommand } = await import('./vs/platform/agentHost/node/copilot/copilotSandboxCertificateCli.js');
		process.exitCode = await runAgentHostCertificateCommand(parsedArgs['agent-host-ca'], parsedArgs['agent-host-ca-confirm'] === true);
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
	}
} else if (shouldSpawnCli) {`, 'if (shouldSpawnCli) {'));

// Sessions test: 1.146 moved Menus and the composite-bar CSS under workbench/contrib/sessions; keep our font
// row height (FONT.sidebarSize42) instead of DEFAULT_NOTIFICATION_ROW_HEIGHT.
resolve('src/vs/sessions/test/browser/workbench.test.ts', [(_, theirs) =>
  replace(theirs, 'DEFAULT_NOTIFICATION_ROW_HEIGHT, ', '') + "import { FONT } from '../../../base/common/font.js';\n"]);
