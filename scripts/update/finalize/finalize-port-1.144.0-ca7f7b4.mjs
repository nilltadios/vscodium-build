// Version-specific resolutions for porting VSCodium ca7f7b4's 1.143.1 patch set to VS Code 1.144.0 (the
// be70704 lineage uses finalize-port-1.144.0.mjs). "ours" is VSCodium's side here: its 53-ext-copilot-remove-it
// empties the agent-host telemetry methods and drops generated session titles, so new upstream bodies for those
// stay out. port-rules.mjs runs afterwards for the recurring parts.
import { edit, replace, resolve } from './port-lib.mjs';

// Keep the port's extensions.excludeUnsafes switch, add 1.144's control-manifest access token, and let the
// port's non-web Connection: close header extend the request headers instead of replacing the token.
resolve('src/vs/platform/extensionManagement/common/extensionGalleryService.ts', [(ours, theirs) =>
  replace(ours, '\t\tconst requestOptions: IRequestOptions = {\n', theirs.split('\n')[0] + '\n\t\tconst requestOptions: IRequestOptions = {\n')]);
edit('src/vs/platform/extensionManagement/common/extensionGalleryService.ts', s =>
  replace(s, "\t\t\trequestOptions.headers = { Connection: 'close' };", "\t\t\trequestOptions.headers = { ...requestOptions.headers, Connection: 'close' };"));

// VSCodium's sourcemap URL still needs product.json; 1.144 adds the build-lifecycle import.
resolve('build/gulpfile.extensions.ts', [(ours, theirs) => ours + theirs]);

// No utility-model title generation (VSCodium removed it with the Copilot API service).
resolve('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', ['ours']);

// Telemetry reporter: VSCodium's stubbed methods and types; 1.144's new bodies and Codex/Fusion fields only feed
// the removed telemetry. The Fusion helpers merged in cleanly and still need their tier/model imports.
resolve('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', [
  (_, theirs) => theirs.split('\n').filter(l => !l.includes('isReasoningEffortLevel')).join('\n'),
  ...Array(5).fill('ours')]);

resolve('src/vs/platform/agentHost/node/agentService.ts', ['theirs']);
resolve('src/vs/platform/agentHost/node/protocolServerHandler.ts', ['theirs']);

// 1.144 runs the packaged app once at build time to generate its Node compile cache. The rootless, capability-free
// builder has no display and cannot set up Chromium's sandbox (zygote chroot fails with SIGTRAP), so only this
// build-time run goes headless and unsandboxed; the shipped app's launch arguments are unchanged.
edit('build/lib/nodeCompileCache.ts', s => replace(s, '\t\tconst child = cp.spawn(application, [], {',
  "\t\tconst child = cp.spawn(application, ['--no-sandbox', '--ozone-platform=headless'], {"));
// Electron's Node appends the generating uid to the cache tag (v24.22.0-x64-<hash>-1000). Node looks up the
// running user's uid, so the cache serves users with the builder's uid; accept the suffix in the validator.
edit('build/lib/nodeCompileCache.ts', s => replace(s, "-[0-9a-f]{8}$/;", "-[0-9a-f]{8}(?:-\\d+)?$/;"));
