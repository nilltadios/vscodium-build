import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const app = path.resolve(process.argv[2]);
const product = JSON.parse(fs.readFileSync(path.join(app, 'product.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8'));
assert.notEqual(product.enableTelemetry, true, 'Product must not enable built-in telemetry');
assert.equal(product.aiConfig, undefined, 'No Application Insights configuration');
assert.equal(product.tasConfig, undefined, 'No experiment service configuration');
assert.equal(product.updateUrl, undefined, 'Local build must not use an official update feed');
assert.equal(product.extensionsGallery.serviceUrl, 'https://open-vsx.org/vscode/gallery');
assert.equal(product.agentSdks, undefined, 'No downloadable proprietary agent SDKs');
for (const name of Object.keys(pkg.dependencies ?? {})) {
  assert(!/^(@github\/copilot|@anthropic-ai\/claude-agent-sdk|@openai\/codex)/.test(name), `Bundled agent dependency: ${name}`);
}
assert(!(product.builtInExtensions ?? []).some(e => /copilot/i.test(e.name)), 'No built-in Copilot extension');
console.log(JSON.stringify({
  version: pkg.version,
  name: product.nameLong,
  builtInTelemetryEnabled: product.enableTelemetry === true,
  gallery: product.extensionsGallery.serviceUrl,
  updateFeed: product.updateUrl ?? null,
  checks: 'passed',
  scope: 'Static product and dependency checks; not a packet capture or audit of user-installed extensions.'
}, null, 2));
