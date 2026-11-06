// Version-specific resolutions for porting the VSCodium ca7f7b4 lineage (local 1.145.00001) to VS Code 1.145.2.
// "ours" is the 1.145.0 port; port-rules.mjs runs afterwards for the recurring parts.
import { edit, replace } from './port-lib.mjs';

// 1.145.2 adds the Copilot tracking ID to edit-source telemetry through copilotSkuTelemetry.ts, a module
// VSCodium removes with the rest of the Copilot agent host (52-ext-copilot-remove-it.json). The event keeps its
// other fields, as VSCodium's other former callers of the module do.
const attribution = 'src/vs/platform/agentHost/node/shared/agentEditAttributionService.ts';
edit(attribution, s => replace(
  replace(s, "import { toCopilotTelemetryData } from './copilotSkuTelemetry.js';\n", ''),
  "\t\t\t\t...toCopilotTelemetryData({ copilotSku: undefined, copilotTrackingId: source.copilotTrackingId }),\n", ''));
