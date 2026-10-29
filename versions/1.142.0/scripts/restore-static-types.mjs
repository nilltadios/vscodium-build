// Retain pure account-format helpers needed by shared telemetry types and tests.
// These files perform no I/O and do not load a provider SDK.
import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname, '..');
const port = path.join(project, 'work/20261002T104058121937812Z/vscode');
const relative = 'src/vs/platform/agentHost/node/codex';
fs.mkdirSync(path.join(port, relative), { recursive: true });
const original = fs.readFileSync(path.join(project, 'sources/vscode', relative, 'codexAccountState.ts'), 'utf8');
const header = original.slice(0, original.indexOf('import type'));
const start = original.indexOf('export interface ICodexAccountState');
const end = original.indexOf('\nexport function', start);
fs.writeFileSync(path.join(port, relative, 'codexAccountState.ts'), header + original.slice(start, end));
const telemetry = fs.readFileSync(path.join(project, 'sources/vscode', relative, 'codexAccountTelemetry.ts'), 'utf8')
  .replace(/^import type \{ PlanType \}.*\n/m, '')
  .replace('Record<PlanType,', 'Record<string,')
  .replace('planType as PlanType', 'planType as keyof typeof chatgptPlanTiers');
fs.writeFileSync(path.join(port, relative, 'codexAccountTelemetry.ts'), telemetry);
console.log('Retained codexAccountState interface and pure codexAccountTelemetry formatting helper.');
