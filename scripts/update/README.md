# Version update driver

Ports the local VSCodium build to a new VS Code release in one command, replacing the per-version
`port-<v>.sh`, `replay-port-<prev>.sh`, `merge-from-<prev>.sh` and `export-port-<v>.sh` scripts, and the hand-typed
`evidence/merge-files.txt`. Background and measurements: [analysis/SPEEDUP.md](../../analysis/SPEEDUP.md).

```bash
bash scripts/update/update.sh 1.142.0 1.143.0
```

This creates `versions/1.143.0`. It copies the previous workspace's generic scripts (skipping version-named
one-offs and backups), overlays `scripts/update/workspace/`, reflinks caches and sources, fetches the new pins,
checks upstream VSCodium for a newer commit, and runs `scripts/port.sh`. The port ends with one report
(`evidence/port/report.md`): reject and merge counts, conflict markers left per file, the finalize error, and
TS errors from a typecheck against the new release's own dependencies.

Loop until the report says `clean`:

1. Resolve the listed conflicts in `versions/<new>/scripts/finalize-port-<new>.mjs` with `resolve()`/`edit()` from
   `port-lib.mjs` (example: `finalize/finalize-port-1.142.0.mjs`). Put a fix that will recur in
   `workspace/port-rules.mjs` instead; rules are idempotent and run on every port.
2. `bash versions/<new>/scripts/port.sh` (about 1 minute; reruns everything from scratch).

When the port is clean, `port.sh` exports `user/zzzz-port-<new>.patch`. It then reapplies the whole patch set
(`check-patches.sh`, all must apply) and checks that the result equals the porting tree (`tree-check.sh`).
Then `bash versions/<new>/scripts/release.sh DP-1` runs build → GUI smoke → STATUS.md. Review the screenshot,
record the review with `record-visual-review.mjs`, and finish with `release.sh --finish`, which runs
`verify-final.mjs` and the test-cleanup check. Copy the finished finalize to `scripts/update/finalize/` so a
replay can find it.

| File | Role |
| --- | --- |
| `update.sh` | create/resume a workspace, fetch, run `port.sh` |
| `workspace/port.sh` | the rerunnable port pipeline and report |
| `workspace/port-lib.mjs`, `port-rules.mjs` | finalize helpers; recurring resolutions (agent SDKs, policy-watcher fork + test factory, os-proxy-resolver globs, agent-host OTel removal) |
| `workspace/merge-files.mjs`, `merge-from.sh`, `replay-port.sh`, `port-rejects.mjs`, `prune-providers.mjs` | rebase leftovers → three-way merge against the previous patched tree; prune also removes provider modules and tests that import an already-removed module |
| `workspace/port-deps.sh` | `npm ci --ignore-scripts` of the new lockfile in the builder, cached by lockfile hash |
| `workspace/export-port.sh`, `tree-check.sh`, `port-report.mjs` | export, reproduce check, report |
| `workspace/test-gui.sh`, `release.sh`, `write-status.mjs` | GUI smoke that polls up to 30 s; one-shot release; version-agnostic STATUS.md |
| `finalize/finalize-port-<v>.mjs` | per-version conflict picks, kept for replays |
| `verify-replay.sh` | regression test: replay 1.141.2 → 1.142.0 and compare with the original |

## Verification

```bash
bash scripts/update/verify-replay.sh
```

Expected: four `PASS` lines and exit 0. It checks that the replay's port report is clean, that
`zzzz-port-1.142.0.patch` is byte-identical to the original, that all 59 rebased patch hashes are identical, and that
the porting tree is identical (`diff -rq`, excluding `.git` and dependencies). A fresh run on 2026-10-17 took 74 s
from an empty workspace (port 67 s). The original 1.142.0 session took 26 minutes from request to build start.
It also reached 0 TS errors in the quick typecheck: with the new dependencies installed, the
`@hpke/core`/`libsodium-wrappers` false positives the 1.142.0 session had to reason around are gone. A
replay workspace is about 9 GB apparent size, mostly reflinks; remove it with `gio trash`.

Not exercised here: `release.sh` builds and the polling `test-gui.sh` were syntax-checked but not run, since
running them needs a full build and opens a window. The not-clean guard of `release.sh` and `write-status.mjs`
(on 1.142.0's real evidence) were run in a scratch copy.

## Shell-hang guard

`~/.claude/hooks/guard-shell-hangs.sh` (PreToolUse, registered in `~/.claude/settings.json`) denies the two
commands that cost the 1.142.0 session 15 minutes: an interpreter reading its program from an unfed stdin
(`python3 -` without heredoc, pipe or `<`), and `pgrep -f`/`pkill -f` whose pattern matches the command itself.
Test: `~/.claude/hooks/test-guard-shell-hangs.sh` (37 cases including both verbatim incident commands, exit 0).
Undo: restore `~/.claude/settings.json.bak-20261016T211238`.

`verify-replay.sh 1.142.0 1.143.1` (2026-10-22, after OTel removal moved into `port-rules.mjs`): port clean, 0 TS
errors, and the tree differs from the released 1.143.1 port in one file only. The released hand-written finalize
deleted the saved-chat test loop (`advertises and routes saved chat reads with exact URI identity`) along with the two
OTel tests in `protocolServerHandler.test.ts`; the rule removes just the two OTel tests. Test files are not shipped,
so the 1.143.10001 AppImage is unaffected. The default replay (1.141.2 → 1.142.0) still passes all four checks.
