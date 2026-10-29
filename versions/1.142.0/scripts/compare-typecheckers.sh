#!/usr/bin/env bash
# Compare VS Code's pinned tsc (Go, @typescript/native) with tsc-rs and bun check on the same tree and tsconfig.
# Usage: compare-typecheckers.sh <work dir with vscode/> [runs]
# Both run on the host with identical flags; dependencies must already be linked (see typecheck-port.sh).
# Output: evidence/typecheck-compare-<stamp>/{summary.tsv,<checker>-<n>.{out,time}, <checker>.diag}
set -euo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
target=$(realpath "${1:?Provide the work directory}")/vscode
runs=${2:-3}
tscrs="$project/cache/tools/tsc-rs/node_modules/@tsc-rs/linux-x64/lib/tsc"
bun="$project/cache/tools/bun-canary/node_modules/@oven/bun-linux-x64/bin/bun"
tsc_args="--project src/tsconfig.json --noEmit --pretty false"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
out="$project/evidence/typecheck-compare-$stamp"
mkdir -p "$out"
cd "$target"
declare -A cmd=(
  [tsc-go]="node node_modules/@typescript/native/bin/tsc $tsc_args"
  [tsc-go-7.1]="node $project/cache/tools/tsc-go-7.1/node_modules/typescript/bin/tsc $tsc_args"
  [tsc-rs]="$tscrs $tsc_args"
  # --all: without it bun groups identical errors above 50, which would skew the count.
  [bun-check]="$bun check --project src/tsconfig.json --no-pretty --all"
)
{
  printf 'target\t%s\nvscode_commit\t%s\n' "$target" "$(jq -r .vscode_commit "$project/sources.lock.json")"
  printf 'tsc-go\t%s\n' "$(node node_modules/@typescript/native/bin/tsc --version)"
  printf 'tsc-go-7.1\t%s (tsc-rs upstream pin)\n' "$(node "$project/cache/tools/tsc-go-7.1/node_modules/typescript/bin/tsc" --version)"
  printf 'tsc-rs\t%s (npm tsc-rs %s)\n' "$("$tscrs" --version)" "$(jq -r .version "$project/cache/tools/tsc-rs/node_modules/tsc-rs/package.json")"
  printf 'bun-check\tbun %s, TypeScript %s\n' "$("$bun" --revision)" "$("$bun" -p process.versions.typescript)"
  printf 'cpu\t%s\nnproc\t%s\n' "$(lscpu | sed -n 's/^Model name: *//p')" "$(nproc)"
} > "$out/versions.txt"
printf 'checker\trun\texit\twall_s\tuser_s\tsys_s\tmax_rss_kb\terrors\n' > "$out/summary.tsv"
for checker in tsc-go tsc-go-7.1 tsc-rs bun-check; do
  # One untimed warm-up so both read the tree from page cache.
  ${cmd[$checker]} > /dev/null 2>&1 || true
  for run in $(seq 1 "$runs"); do
    set +e
    /usr/bin/time -f '%e\t%U\t%S\t%M' -o "$out/$checker-$run.time" \
      ${cmd[$checker]} > "$out/$checker-$run.out" 2>&1
    status=$?
    set -e
    printf '%s\t%s\t%s\t%s\t%s\n' "$checker" "$run" "$status" "$(tail -1 "$out/$checker-$run.time")" \
      "$(grep -c 'error TS' "$out/$checker-$run.out" || true)" >> "$out/summary.tsv"
  done
  grep 'error TS' "$out/$checker-1.out" | sort > "$out/$checker.diag" || true
done
# Each alternative is compared with Go at the TypeScript version it claims to match:
# tsc-rs pins 7.1.0-dev; bun check reports TypeScript 7.0.2, VS Code's own pin.
for pair in tsc-go:tsc-rs tsc-go-7.1:tsc-rs tsc-go:bun-check tsc-go-7.1:bun-check; do
  ref=${pair%%:*} alt=${pair#*:}
  if diff -u "$out/$ref.diag" "$out/$alt.diag" > "$out/diagnostics-$ref-vs-$alt.diff"; then v=identical; else v=different; fi
  printf '%s vs %s\t%s\n' "$ref" "$alt" "$v"
done > "$out/diagnostics-verdict.txt"
column -t "$out/summary.tsv"
cat "$out/diagnostics-verdict.txt"
printf '%s\n' "$out" > "$project/evidence/latest-typecheck-compare.txt"
