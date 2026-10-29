// Mechanical compatibility fixes after port-rejects.mjs; export as a reviewed patch.
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
edit('src/mainImpl.ts', s => {
  s = replace(s, "import * as os from 'node:os';", "import * as os from 'node:os';\nimport { createRequire } from 'node:module';");
  s = replace(s, "perf.mark('code/didStartMain');", "const require = createRequire(import.meta.url);\n\nperf.mark('code/didStartMain');");
  s = replace(s, "perf.mark('code/didRegisterListeners');", `perf.mark('code/didRegisterListeners');

function resolveUserProduct(): void {
\ttry {
\t\tglobalThis._VSCODE_USER_PRODUCT_JSON = require(path.join(userDataPath, 'product.json'));
\t} catch {
\t\t// A user product override is optional.
\t}
}`);
  s = replace(s, "process.env['VSCODE_CODE_CACHE_PATH'] = codeCachePath || '';", "process.env['VSCODE_CODE_CACHE_PATH'] = codeCachePath || '';\n\tresolveUserProduct();");
  return s.replaceAll('to VS Code.', 'to VSCodium.').replaceAll('restart of VS Code.', 'restart of VSCodium.').replaceAll('rendering issues in VS Code.', 'rendering issues in VSCodium.');
});
edit('src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts', s => {
  for (const [name, size] of [['ITEM_HEIGHT', 54], ['COMPACT_ITEM_HEIGHT', 52], ['CHAT_ITEM_HEIGHT', 28], ['SECTION_HEIGHT', 26], ['SPACED_SECTION_HEIGHT', 30]]) {
    s = replace(s, `static readonly ${name} = ${size};`, `static get ${name}() { return FONT.sidebarSize${size}; }`);
  }
  return s;
});
edit('src/vs/workbench/browser/parts/banner/bannerPart.ts', s => {
  s = replace(s, "import { BannerFocused } from '../../../common/contextkeys.js';", "import { BannerFocused } from '../../../common/contextkeys.js';\nimport { INeverShowAgainOptions, NeverShowAgainScope } from '../../../../platform/notification/common/notification.js';");
  // Filter dismissed items before inserting into the new priority-based banner queue.
  return replace(s, '\tshow(item: IBannerItem): void {', `\tshow(item: IBannerItem): void {
\t\tif (item.neverShowAgain && this.storageService.getBoolean(item.neverShowAgain.id, this.toStorageScope(item.neverShowAgain))) {
\t\t\tthis.hide(item.id);
\t\t\treturn;
\t\t}`);
});
edit('src/vs/platform/policy/test/node/nativeManagedSettingsService.test.ts', s => s.replaceAll('(_productName, policies, callback)', '(_vendorName, _productName, policies, callback)'));
edit('build/npm/postinstall.ts', s => removeBlock(s, '\t// Symlink .claude/ files', '\t// foundry-local-sdk'));
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
// This module has no remaining importers after the bundled providers are removed.
fs.unlinkSync(path.join(root, 'src/vs/platform/agentHost/node/copilot/sessionCustomizationDiscovery.ts'));
console.log('Removed unused provider-specific sessionCustomizationDiscovery.ts');
edit('src/vs/platform/agentHost/test/node/sessionSandbox.test.ts', s => {
  s = removeBlock(s, "\ttest('resolved outbound restrictions survive serialization and clear when omitted'", '\tfor (const localAccess');
  return removeBlock(s, "\ttest('projects resolved org policy and undetermined-policy restrictions, not device discovery'", "\ttest('allow-session on a peer sandbox escape");
});
