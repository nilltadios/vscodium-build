// Version-specific resolutions for porting the 1.143.1 patch set to VS Code 1.144.0 (conflict picks and edits
// for what is new in 1.144). Run by port.sh after merge-from.sh and prune-providers.mjs; port-rules.mjs runs
// afterwards and handles the recurring parts (agent SDK removal, policy-watcher fork and its test factory,
// os-proxy-resolver globs, agent-host OTel removal).
import { edit, replace, resolve } from './port-lib.mjs';

// The port removed the registry's SDK system-message resolution (Copilot SDK); 1.144 only reworked it.
resolve('src/vs/platform/agentHost/node/copilot/prompts/promptRegistry.ts', ['ours']);

// Keep the port's extensions.excludeUnsafes switch, add 1.144's control-manifest access token, and let the
// port's non-web Connection: close header extend the request headers instead of replacing the token.
resolve('src/vs/platform/extensionManagement/common/extensionGalleryService.ts', [(ours, theirs) =>
  replace(ours, '\t\tconst requestOptions: IRequestOptions = {\n', theirs.split('\n')[0] + '\n\t\tconst requestOptions: IRequestOptions = {\n')]);
edit('src/vs/platform/extensionManagement/common/extensionGalleryService.ts', s =>
  replace(s, "\t\t\trequestOptions.headers = { Connection: 'close' };", "\t\t\trequestOptions.headers = { ...requestOptions.headers, Connection: 'close' };"));

// VSCodium's sourcemap URL still needs product.json; 1.144 adds the build-lifecycle import.
resolve('build/gulpfile.extensions.ts', [(ours, theirs) => ours + theirs]);

// Session titles: keep the port's deterministic fallback titles (no utility-model or GitHub-context generation).
resolve('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', ['ours']);

resolve('src/vs/platform/agentHost/node/agentService.ts', ['theirs']);
resolve('src/vs/platform/agentHost/node/protocolServerHandler.ts', ['theirs']);
resolve('src/vs/platform/agentHost/test/node/protocolServerHandler.test.ts', ['theirs', 'theirs']);

// Telemetry reporter: keep 1.144's Fusion turn fields (inert while telemetry is disabled) minus Codex account fields.
const noCodex = (_, theirs) => theirs
  .replace(', Partial<ICodexAccountTelemetryContext>', '')
  .replace(' & CodexAccountTelemetryClassification', '')
  .split('\n').filter(l => !l.includes('codexModelProvider?:')).join('\n');
resolve('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', [noCodex, noCodex, noCodex, noCodex]);

// 1.144 runs the packaged app once at build time to generate its Node compile cache. The rootless, capability-free
// builder has no display and cannot set up Chromium's sandbox (zygote chroot fails with SIGTRAP), so only this
// build-time run goes headless and unsandboxed; the shipped app's launch arguments are unchanged.
edit('build/lib/nodeCompileCache.ts', s => replace(s, '\t\tconst child = cp.spawn(application, [], {',
  "\t\tconst child = cp.spawn(application, ['--no-sandbox', '--ozone-platform=headless'], {"));
// Electron's Node appends the generating uid to the cache tag (v24.22.0-x64-<hash>-1000). Node looks up the
// running user's uid, so the cache serves users with the builder's uid; accept the suffix in the validator.
edit('build/lib/nodeCompileCache.ts', s => replace(s, "-[0-9a-f]{8}$/;", "-[0-9a-f]{8}(?:-\\d+)?$/;"));
