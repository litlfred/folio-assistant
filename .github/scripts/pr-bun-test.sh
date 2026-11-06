#!/usr/bin/env bash
#
# The `bun test` step of one `typescript-test` shard (code-quality-gates.yml).
#
# Reads the scope `pr-test-scope.ts` wrote ($CQG_TEST_SCOPE):
#
# - no scope file, or `"kind": "all"` → `bun test`, the whole suite, sharded
#   by `--shard` in BUN_OPTIONS exactly as before. Every push to main, merge
#   group, dispatch and nightly run takes this branch.
# - `"kind": "some"` → this shard's share of the selected files (every 4th of
#   the sorted list), passed as `./path` so Bun reads each as a path, not a
#   name filter. `--shard` is dropped from BUN_OPTIONS: the share is already
#   this shard's.
# - an empty share → NOTHING runs, and the job summary says so as
#   "skipped — not affected", which is not a pass: no test was asked.
#
# Usage: bash .github/scripts/pr-bun-test.sh --scope   (writes $CQG_TEST_SCOPE, sets the
#                                                      step output `kind`: all | some)
#        bash .github/scripts/pr-bun-test.sh <shard> <of>
#
# The `--scope` line is NOT a `bun` line on purpose: `gatesFrom`
# (cat-harness-tools scripts/gates.ts) reads every `bun …` line of the workflow
# as a gate to run locally, and choosing tests is not a gate.
set -uo pipefail

if [ "${1:-}" = "--scope" ]; then
  : "${CQG_TEST_SCOPE:?CQG_TEST_SCOPE names the scope file to write}"
  # Bounded: a selection that cannot finish in 5 minutes selects nothing,
  # so `kind` stays unset and the last step runs the whole suite.
  timeout 300 bun "$(dirname "${BASH_SOURCE[0]}")/pr-test-scope.ts" --out "$CQG_TEST_SCOPE" || exit 0
  kind="$(bun -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf-8")).kind)' "$CQG_TEST_SCOPE" 2>/dev/null || echo all)"
  [ -n "${GITHUB_OUTPUT:-}" ] && echo "kind=$kind" >> "$GITHUB_OUTPUT"
  if [ "$kind" != "some" ]; then
    why="$(bun -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf-8")).why ?? "")' "$CQG_TEST_SCOPE" 2>/dev/null)"
    echo "### bun test: the whole suite runs on this pull request — $why" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  fi
  exit 0
fi

shard="${1:?shard}"
of="${2:?of}"
scope="${CQG_TEST_SCOPE:-}"
summary="${GITHUB_STEP_SUMMARY:-/dev/null}"

kind=""
if [ -n "$scope" ] && [ -f "$scope" ]; then
  kind="$(bun -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf-8")).kind ?? "")' "$scope" 2>/dev/null || true)"
fi

if [ "$kind" != "some" ]; then
  why="no scope was computed (not a pull request)"
  [ -n "$kind" ] && why="$(bun -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf-8")).why ?? "")' "$scope")"
  echo "### bun test — shard $shard/$of: the whole suite ($why)" >> "$summary"
  exec bun test
fi

mapfile -t share < <(bun -e '
  const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf-8"));
  const k = Number(process.argv[2]), n = Number(process.argv[3]);
  [...s.files].sort().forEach((f, i) => { if (i % n === k - 1) console.log(f); });
' "$scope" "$shard" "$of")
total="$(bun -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf-8")).files.length)' "$scope")"

if [ "${#share[@]}" -eq 0 ]; then
  {
    echo "### ⏭ bun test — shard $shard/$of: skipped — not affected"
    echo
    echo "This pull request's change can affect $total test file(s), and none of them fall to this shard,"
    echo "so **no test ran here. This is not a pass** — it is a question this PR did not need to ask."
    echo "The whole suite runs on the push of the merge to \`main\`."
  } >> "$summary"
  echo "bun test shard $shard/$of: skipped — not affected (0 of $total selected file(s) fall to this shard)"
  exit 0
fi

{
  echo "### bun test — shard $shard/$of: ${#share[@]} of $total affected test file(s)"
  echo
  echo "The rest of the suite is **skipped — not affected** by this pull request (not a pass); it runs on the push to \`main\`."
  echo
  echo "<details><summary>files run here, and why each was selected</summary>"
  echo
  bun -e '
    const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf-8"));
    for (const f of process.argv.slice(2)) console.log(`- \`${f}\` — ${s.why[f] ?? ""}`);
  ' "$scope" "${share[@]}"
  echo
  echo "</details>"
} >> "$summary"

# The share is this shard's already, so the `--shard` BUN_OPTIONS carries for
# the whole-suite case must not split it again.
BUN_OPTIONS="$(printf '%s' "${BUN_OPTIONS:-}" | sed -E 's/(^| )--shard=[^ ]+//g')"
export BUN_OPTIONS
args=()
for f in "${share[@]}"; do args+=("./$f"); done
exec bun test "${args[@]}"
