# Port to VS Code 1.140.0

This port starts with the validated 1.139.1 replacement patches from the parent
project. A reflink copy preserves the original build, source checkout, caches,
and installed AppImage. `evidence/patches-before-1.140-port/` retains that patch
set before rebasing. The VSCodium scripts remain at the prior pinned commit.

`scripts/port-patches.sh` applied each patch to a disposable source copy.
Successful hunks became the rebased patch set. Rejected hunks and the full
application log are saved under `evidence/rejects/` and `logs/`. The script
continues on rejects, so its exit 0 alone does not establish a successful port.

The main compatibility patch is `patches/rebased/user/zz-port-1.140.0.patch`.
It applies after the inherited `99-port-1.139.1.patch`. Its changes include:

- Move optional user product overrides and argv branding to `src/mainImpl.ts`,
  where upstream moved Electron startup.
- Update agent-list font dimensions, including the new child-chat row.
- Adapt dismissed end-of-life banners to the priority-based banner queue.
- Retain the current upstream external-session description, which no longer
  mentions VS Code. No branding replacement is needed for that rejected hunk.
- Remove leftover modules and tests tied to omitted provider SDKs, including
  Fusion, sandbox diagnostics, provider customizations, and the unused discovery
  module. Keep shared sandbox code and its remaining tests.
- Retain two static Codex account-format helpers used by shared telemetry code
  and tests. They load no provider SDK and perform no I/O. Telemetry defaults
  remain off; retaining these helpers does not enable collection.
- Remove the obsolete null OTel service SDK method and retain the shared mock
  default-chat URI import needed by the new tests.
- Remove provider dependencies by package name, then regenerate root, build,
  and remote locks rather than reuse obsolete dependency versions.

Mechanical operations are recorded in `scripts/port-rejects.mjs`,
`scripts/finalize-port.mjs`, `scripts/prune-providers.mjs`,
`scripts/restore-static-types.mjs`, and `scripts/fix-typecheck.mjs`.
Their output is under `evidence/`. These are port-development scripts for the
recorded disposable work directory. The reviewable patches and
`scripts/build.sh` are the reproduction path for a fresh build.

The first compile failed on a missing static Codex helper. A subsequent
typecheck found an obsolete null-service method and a missing mock helper
import. The failed commands, diagnostics, and exit statuses remain in the
append-only timing record. Final status is recorded separately in `STATUS.md`.

A fresh build compiled but its typecheck exposed six provider files missing
from the exported removals. The diagnostic exporter used `git add -N`, which
stages deleted files, and then exported only the unstaged diff. The exporter
now compares against the Git tree saved immediately before each patch.
`scripts/export-missing-deletions.mjs` compares TypeScript files in the intended
port tree with the fresh build and produces
`patches/rebased/user/zzz-retire-provider-files.patch`. Its removal list is in
`evidence/omitted-removals.txt`. A redundant build started before that exporter
finished was stopped in its own container; its exit 137 is recorded.

The normal AppImage launch keeps the prior opt-in process-lifetime repair.
The GUI test also closes its exact isolated main process and checks that no
process with that profile remains after capture. It does not signal an installed
editor instance.
