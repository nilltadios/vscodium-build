# Why version updates take 20–33 minutes, and how to cut that

Written 2026-10-16. Data sources, all rerunnable:

- `uv run analysis/analyze_sessions.py > analysis/session-breakdown.md`: splits each Claude session into model, tool and user-wait time (transcripts in `~/.claude/projects/-home-nilllinux22-Documents-VSCodium-Build/`).
- `versions/<v>/TIMINGS.md` / `evidence/timings.jsonl`: per-stage machine timings, one log per stage.
- 1.140.0 was a Codex run (`~/.codex/memories/MEMORY.md`, task "Build and verify VSCodium 1.140.0"). It has stage timings but no Claude transcript.

## Where the time went

| Version | Elapsed | Clean build + package + GUI | Lost to | Approx. lost |
| --- | ---: | ---: | --- | ---: |
| 1.140.0 (Codex) | ~29 min | ~6 min | 3 full builds that failed on port errors only gulp found (191 s, 250 s, 80 s) | ~9 min |
| 1.141.0 | 29 min | ~6 min | tsc-rs / bun typechecker benchmarks (user detour, not waste); packaging path fixes | ~2 min |
| 1.141.2 | 19.5 min | ~6 min | 114 API round trips; 4 typecheck loops; brittle electron-version test; GUI smoke sampled too early (main=0 renderer=0 at 15 s) | ~4 min |
| 1.142.0 | 33 min | ~6 min | **two hung commands of mine**: `python3 - 2>/dev/null` waited on stdin until the 600 s timeout; `while pgrep -f 'scripts/port-1.142.0.sh'` matched its own command line until the 300 s timeout | **~15 min** |

The machine work (port scripts ~25 s each, editor build ~4 min, typecheck 30 s, AppImage 22 s, GUI smoke 44 s) is about 6–7 minutes in every run. The rest is agent iteration:

1. **Self-inflicted hangs** (1.142.0): 15 of 33 minutes.
2. **Rebuilding the port tooling each version.** Version-named scripts grew 0 → 3 → 6 → 12 (`port-1.142.0.sh`, `replay-port-1.141.2.sh`, `merge-from-1.141.2.sh`, `finalize-port-1.142.0.mjs`, `export-port-1.142.0.sh`, …). Each new version copies and renames them, then hand-edits them. `evidence/merge-files.txt` is also typed by hand. That accounts for most of the 70–115 round trips per session, at about 5–8 s each.
3. **The quick typecheck uses the previous version's `node_modules`.** New dependencies show up as false errors that have to be argued away: `@hpke/core`/`libsodium-wrappers` in 1.142.0, `@vscodium/os-proxy-resolver` in 1.141.2. Fixing real errors takes 3–4 loops of about 16 s plus reasoning each.
4. **The same resolutions are rewritten every version.** For example: remove the Copilot/Anthropic/Codex SDKs by name, keep the `@vscodium/policy-watcher` fork, drop the Codex telemetry fields, keep deterministic session titles. `finalize-port-1.142.0.mjs` literally says "as in 1.141.2".
5. **Flaky checks cost a retry each.** The GUI smoke samples the processes once at 15 s (failed first in 1.140.0 and 1.141.2). The electron-version test hard-coded `.npmrc` handling that upstream changed.

## Speedups, biggest first

| # | Change | Saves | Effort |
| --- | --- | --- | --- |
| 1 | **Shell guardrail** in the existing `~/.claude/hooks` PreToolUse hook: reject a bare `<interpreter> -` with no heredoc or pipe, and reject `pgrep -f`/`pkill -f` patterns that also occur in the same command. Wait with `wait $pid`, a pidfile, or `run_in_background` plus the completion notification instead. | up to 15 min when it hits | small |
| 2 | **One version-agnostic driver**, `scripts/update.sh <prev> <new>`: create the reflinked workspace and resolve pins, check whether upstream VSCodium already has newer patches (1.141.2 was the fast run for this reason), then rebase → replay → port-rejects. It works out the merge-file list from the unresolved rejects itself, then runs the three-way merge against `<prev>`, prune-providers, carried-over resolutions and lock refresh. It ends with **one** concise report of remaining conflict markers and TS errors. After that, the agent only edits resolutions and reruns one command. | 5–10 min, ~half the round trips | medium |
| 3 | **Install the new dependencies early**: start `npm ci` (~60–80 s) in the builder container in the background right after the lock refresh, while conflicts are being resolved. The quick typecheck then reports only real errors. | 2–4 min + wrong-lead reasoning | small |
| 4 | **Persistent resolution rules** (`port-rules.mjs`): idempotent edits that run on every port (SDK removal by name, policy-watcher fork, Codex fields, OTel removal, session titles). Only version-specific conflict picks go in `finalize-<new>.mjs`. | 2–5 min | small–medium |
| 5 | **One-shot release run**: `build.sh` → GUI smoke → write-status → verify-final as one background job. Make the GUI check poll for up to 30 s instead of sampling once at 15 s, and make the electron test read the version from source. | 1–3 min, no retries | small |
| 6 | (Optional; the build itself is not the bottleneck.) The builder is capped at `--cpus=4` on a 16-thread host, and `esbuild-bundle-linux-x64-min` takes 108 s. `--cpus=8` would likely shorten it, but RAM (14 GiB total, 8 GiB container) is the real limit. | ~1 min | trivial |

Expected result with 1–5: about 10–12 minutes per update (2–5 min of real conflict work + ~6 min of unattended build/package/GUI), down from 20–33. A version with no new conflicts would need about one command.

## Status (2026-10-17)

Speedups 1–5 are implemented; see [scripts/update/README.md](../scripts/update/README.md). Replaying 1.141.2 → 1.142.0
with `scripts/update/update.sh` reproduces the original port exactly in 74 s (byte-identical port patch, identical
tree; `bash scripts/update/verify-replay.sh`). The quick typecheck reached 0 errors because it now uses the new
release's dependencies. Replay report: [replay-1.142.0-port-report.md](replay-1.142.0-port-report.md).
Two bugs found while building the driver are fixed in the template and guarded by checks:
- the 1.141.2 copy of `port-rejects.mjs` ignored its reject-dir argument; the fixed copy now lives in the template;
- staging deletions in the real index dropped them from the exported patch; `tree-check.sh` now catches this.
Not run: a full build through `release.sh`, and the polling GUI smoke (it opens a window).

## First real use: 1.142.0 → 1.143.1 (2026-10-22)

From `uv run analysis/analyze_sessions.py` (session `e4bea901…`, first prompt only) and
`versions/1.143.1/evidence/timings.jsonl`:

| | 1.142.0 (by hand) | 1.143.1 (update.sh) |
| --- | ---: | ---: |
| Merge conflicts to resolve | 38 in 13 files | 55 in 13 files |
| Request → build start | 26 min | ~9 min (02:55 → 03:04:00) |
| Request → released and verified | ~32 min | ~15.5 min (→ 03:10:28) |
| Whole turn, incl. replay regression | 33.3 min | 17.3 min |
| API calls | 71 | 58 |
| Port reruns until clean | — | 5 (≈45–60 s each) |

What paid off: one command for workspace + port; every one of the 65 TS errors was real (typecheck against the new
release's dependencies); `port-rules.mjs` handled the SDK removal and policy-watcher fork without any work from me;
`release.sh` ran build → GUI smoke in one background job and the polling smoke passed first try; no shell hangs.
Machine time (build 332 s + smoke 43 s) is unchanged, as expected.

Still manual, so candidates for `port-rules.mjs`: OTel removal (`NullAgentHostOTelService` arguments, `_otelService`
lines, OTel imports) was again written by hand, as in 1.142.0. New in the template from this run: transitive
pruning in `prune-providers.mjs` (45 → 56 pruned modules and tests; it replaced deleting each one by hand), and the
typed-factory form of the policy-watcher rule.
Caveat: one run per method, with different conflict loads, so this is evidence, not a controlled benchmark.
Done afterwards (2026-10-22): the OTel removal is now the `agent-host-otel` rule, and `finalize-port-1.143.1.mjs`
shrank from 124 to 98 lines (the OTel conflicts became plain `'theirs'` picks). Both replays were verified; see
`scripts/update/README.md`.
