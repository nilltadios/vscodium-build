// Second pass after the first 1.141 typecheck: unused symbols left by the title stub, and new uses of renamed UI constants.
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
// Duplicate search was removed; keep the constructor parameter for subclasses and tests.
edit('src/vs/workbench/contrib/issue/browser/baseIssueReporterService.ts', s => replace(s,
  '\t\tprivate readonly fetcher: typeof fetch =', '\t\tprotected readonly fetcher: typeof fetch ='));
// 00-ui-custom-font replaces SELECT_OPTION_HEIGHT with the configurable sidebar size; 1.141 added another use.
edit('src/vs/base/browser/ui/selectBox/selectBoxCustom.ts', s => replace(s,
  '(this.selectBoxOptions.maxVisibleOptions ?? Infinity) * SELECT_OPTION_HEIGHT)', '(this.selectBoxOptions.maxVisibleOptions ?? Infinity) * FONT.sidebarSize22)'));
