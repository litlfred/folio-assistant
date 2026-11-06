#!/usr/bin/env bash
#
# The shell of the judged jobs in `code-quality-gates.yml`: owner card
# Q-PIPE-1 A (2026-11-01), issue #2899. A PR is judged by "no new failures
# compared with main", not by the reds main already has.
#
# Every step still runs through `gate-shell.sh`, unchanged, so a failing step
# still writes its summary and its annotation.
#
# Until the job's `--begin` step has run, a step's exit status is passed
# through as it is: setup fails the job exactly as before. So does a step
# with `CQG_UNJUDGED=true`, at any point. After it, each
# step's exit status is RECORDED (`cqg_judge.py record`) and the step exits 0,
# so the next gate still runs. The job's verdict is the last step's:
# `cqg_judge.py verdict` fails on any failure on push, merge_group and
# workflow_dispatch, and on a pull request on any failure main's record does
# not have. A step with `CQG_VERDICT=true` gives that verdict itself, after
# its own command; the two jobs that end in a gate which must stay last
# (`check:red-gate-is-last`) do that.
#
# Nothing is masked: a recorded failure is either the verdict's failure or
# listed in its summary as failing on main too. If the record cannot be
# written, the step fails.
#
# Usage (from the workflow):
#   defaults:
#     run:
#       shell: bash ${{ github.workspace }}/.github/scripts/cqg-step.sh {0}
#   run: bash .github/scripts/cqg-step.sh --begin    (the step that starts judging)

dir="${CQG_DIR:-${RUNNER_TEMP:?RUNNER_TEMP is unset}/cqg}"

if [ "${1:-}" = "--begin" ]; then
  mkdir -p "$dir" && echo judge > "$dir/phase"
  exit $?
fi

script="$1"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
gate_shell="${CQG_GATE_SHELL:-$here/../../cat-harness-tools/scripts/gate-shell.sh}"
# The verdict's token, kept out of the step's own environment.
token="${CQG_TOKEN:-}"

# Before `--begin`, or on a step marked `CQG_UNJUDGED=true` (setup and the
# verdict itself), the exit status passes through unrecorded.
if [ ! -f "$dir/phase" ] || [ "${CQG_UNJUDGED:-}" = "true" ]; then
  env -u CQG_TOKEN bash "$gate_shell" "$script"
  exit $?
fi

[ -n "${CQG_JUNIT:-}" ] && rm -f "$CQG_JUNIT"
log="$(mktemp "$dir/step.XXXXXX")"
env -u CQG_TOKEN bash "$gate_shell" "$script" 2>&1 | tee "$log"
status="${PIPESTATUS[0]}"

if ! python3 "$here/cqg_judge.py" record "$script" "$status" "$log"; then
  echo "::error::cqg-step: could not record this step's result (exit $status), so it is not deferred"
  [ "$status" -ne 0 ] && exit "$status"
  exit 2
fi
if [ "$status" -ne 0 ]; then
  echo "cqg-step: exit $status recorded; the job's verdict decides whether it is new"
  [ -n "${GITHUB_ENV:-}" ] && echo "CQG_FAILED=true" >> "$GITHUB_ENV"
fi

if [ "${CQG_VERDICT:-}" = "true" ]; then
  GH_TOKEN="$token" python3 "$here/cqg_judge.py" verdict
  exit $?
fi
exit 0
