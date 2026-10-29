// Second pass after the first 1.141.2 typecheck. Run once after finalize-port-1.141.2.mjs.
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
const replaceAll = (s, old, fresh, count) => {
  const found = s.split(old).length - 1;
  if (found !== count) throw new Error(`Expected ${count} of ${old}, found ${found}`);
  return s.split(old).join(fresh);
};
const removeBlock = (s, first, last) => {
  const a = s.indexOf(first), b = s.indexOf(last, a + first.length);
  if (a < 0 || b < 0) throw new Error(`Missing block: ${first}`);
  return s.slice(0, a) + s.slice(b);
};

// Unused symbols left by the title-generation stub (same as the 1.141.0 port).
edit('src/vs/platform/agentHost/node/agentHostSessionTitleController.ts', s => {
  s = replace(s, "import { Disposable, DisposableStore } from '../../../base/common/lifecycle.js';", "import { Disposable } from '../../../base/common/lifecycle.js';");
  s = replace(s, "import type { GitHubIssueOrPullRequest } from '../../github/common/githubQueryService.js';\n", '');
  s = replace(s, "import { ICopilotApiService, type ICopilotUtilityChatMessage } from './shared/copilotApiService.js';\n", '');
  for (const name of ['MAX_TITLE_TOKENS', 'GITHUB_CONTEXT_REQUEST_TIMEOUT', 'MAX_GITHUB_CONTEXT_BODY_CHARS', 'MAX_GITHUB_CONTEXT_REFERENCES',
    'MAX_TRAILING_HAN_SUFFIX_CODE_UNITS', 'MIN_LATIN_LETTERS_BEFORE_HAN_SUFFIX', 'MIN_LATIN_LETTER_RATIO', 'HAN_CHARACTER', 'TRAILING_HAN_SUFFIX', 'GITHUB_ISSUE_OR_PULL_REQUEST_URL_PATTERN']) {
    const line = s.split('\n').find(l => l.startsWith(`const ${name} = `));
    if (!line) throw new Error(`Missing constant ${name}`);
    s = replace(s, line + '\n', '');
  }
  return s;
});

// Telemetry reporter: upstream's import removals applied but its 1.140-shaped body removals were rejected.
// Keep the provider-neutral reporting (telemetry is disabled by default) and drop only Codex, Copilot SKU and OTel parts.
edit('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', s => {
  s = replace(s, "import { type ISessionWithDefaultChat } from '../common/state/sessionState.js';",
    "import { isAhpChatChannel, isSubagentChatUri, isSubagentSession, parseRequiredSessionUriFromChatUri, type ISessionWithDefaultChat } from '../common/state/sessionState.js';");
  s = replaceAll(s, ' & CodexAccountTelemetryClassification', '', 2);
  s = replaceAll(s, "\t\t\t...(report.provider === 'codex' ? getCodexAccountTelemetryData(report.providerTelemetryContext?.codex) : undefined),\n", '', 2);
  s = replace(s, '\t\t\t...this._copilotSku(provider),\n', '');
  s = removeBlock(s, '\t\tthis._otelService?.emitTurnTiming({\n', '\t\tthis._telemetryService.publicLog2<IAgentHostTurnCompletedEvent, IAgentHostTurnCompletedClassification>(');
  return replace(s, '\nexport interface IAgentHostTurnHungEvent ', `
function normalizeTurnActivityKind(activityKind: string): AgentHostTurnActivityTelemetryKind {
\tif (activityKind === 'none') {
\t\treturn 'none';
\t}

\treturn turnActivityKindsByActionType[activityKind as keyof typeof turnActivityKindsByActionType] ?? 'other';
}

export interface IAgentHostTurnHungEvent `);
});

// The OTel service module is removed, so its registration test goes too.
edit('src/vs/platform/agentHost/test/node/agentHostServices.test.ts', s =>
  removeBlock(s, "\ttest('preserves the host fetch implementation in OTel service options', () => {\n", "\ttest('descriptor-created services have one disposal owner', () => {"));

// Codex account fields are no longer classified, so the event types must not carry them either.
edit('src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts', s => {
  s = replaceAll(s, ' extends IAgentHostEventTelemetry, Partial<ICodexAccountTelemetryContext> {', ' extends IAgentHostEventTelemetry {', 2);
  return replace(s, ', type ICodexAccountTelemetryContext } from \'../common/agentHostTelemetry.js\';', ' } from \'../common/agentHostTelemetry.js\';');
});

// 21-policy-use-custom-lib adds a vendor argument to the watcher factory; 1.141 added two tests using the old shape.
edit('src/vs/platform/policy/test/node/nativeManagedSettingsService.test.ts', s =>
  replaceAll(s, 'NativePolicyWatcherFactory = (_productName, policies, callback) =>', 'NativePolicyWatcherFactory = (_venderName, _productName, policies, callback) =>', 2));
