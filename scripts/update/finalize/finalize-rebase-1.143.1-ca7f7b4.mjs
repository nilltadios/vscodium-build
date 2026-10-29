// Local fixes on top of VSCodium ca7f7b4's own patches for VS Code 1.143.1 (port.sh vscodium-rebase mode).
import { edit, replace } from './port-lib.mjs';

// 00-ui-report-issue removes the issue reporter's only fetch; our typecheck rejects the unused private field
// (VSCodium's transpile-only build does not). Keep the constructor signature and make the field non-private.
edit('src/vs/workbench/contrib/issue/browser/baseIssueReporterService.ts', s => replace(s,
  '\t\tprivate readonly fetcher: typeof fetch = (input, init) => fetch(input, init),',
  '\t\tpublic readonly fetcher: typeof fetch = (input, init) => fetch(input, init),'));
