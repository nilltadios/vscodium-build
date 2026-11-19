#!/usr/bin/env bash
set -uo pipefail
project=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
stage=$1
shift
mkdir -p "$project/logs" "$project/evidence"
start=$(date -u +%Y-%m-%dT%H:%M:%SZ)
stamp=$(date -u +%Y%m%dT%H%M%S%NZ)
start_ns=$(date +%s%N)
log="$project/logs/$stamp-$stage.log"
printf 'Stage: %s\nStarted: %s\nCommand:' "$stage" "$start" | tee "$log"
printf ' %q' "$@" | tee -a "$log"
printf '\n' | tee -a "$log"
"$@" 2>&1 | tee -a "$log"
status=${PIPESTATUS[0]}
end_ns=$(date +%s%N)
elapsed=$(awk -v a="$start_ns" -v b="$end_ns" 'BEGIN {printf "%.3f", (b-a)/1000000000}')
jq -nc --arg stage "$stage" --arg start "$start" --arg end "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg log "$log" --argjson seconds "$elapsed" --argjson exit_code "$status" \
  '{stage:$stage,start:$start,end:$end,seconds:$seconds,exit_code:$exit_code,log:$log}' >> "$project/evidence/timings.jsonl"
printf '\nStage %s: %s seconds, exit %s\n' "$stage" "$elapsed" "$status" | tee -a "$log"
exit "$status"
