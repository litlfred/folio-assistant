#!/usr/bin/env bash
#
# THE SHELL every `run:` step in `code-quality-gates.yml` uses, so that a
# failing step says WHAT failed somewhere a reader can actually get at.
#
# Bean `yqc4`. A red check run here carried its diagnosis in exactly one
# place: the job log, on `productionresultssa*.blob.core.windows.net`. A
# cloud session whose network policy denies that host sees only
#
#     output.title    null
#     output.summary  null
#     annotations     "Process completed with exit code 1."
#
# Measured 2026-10-03 on PR #1949: a red `Skill-registration chain` gave
# exactly that, and `GET .../job-logs.txt` returned Forbidden. The gate whose
# whole purpose is to name which derived artefact went stale reported a bare
# exit code. `$GITHUB_STEP_SUMMARY` fixes it because it surfaces in the check
# run's `output.summary`, which is an API FIELD — readable with no access to
# the log host at all.
#
# ## Why a shell rather than 100 `if: failure()` steps
#
# The workflow has 100 `run:` steps across 14 jobs. A per-step block is 100
# edits, 100 chances to drift, and nothing that fails when the 101st step
# arrives without one. GitHub lets a job name its own shell as a command
# template whose `{0}` is the generated step script, so ONE wrapper covers
# every step in every job that opts in, and a new step is covered by being
# written.
#
# ## The semantics this MUST NOT change
#
# GitHub's default for a `run:` step on Linux is `bash -e {0}` — NOT
# `bash -eo pipefail`. So this runs `bash -e` and nothing more. Adding
# `pipefail` here would redden steps that are green today, for a reason
# unrelated to observability, and the breakage would look like a real
# finding. The step's own script is free to `set -o pipefail` itself, and
# many do.
#
# The exit status is taken from `PIPESTATUS[0]`, the status of the step
# script — never from `tee`, which succeeds almost always and would turn
# every failure green. That is the one bug in this file that would be
# invisible: the gate set would pass and judge nothing.
#
# Usage (from the workflow, not by hand):
#   defaults:
#     run:
#       shell: cat-harness/scripts/gate-shell.sh {0}

script="$1"

if [ -z "$script" ] || [ ! -f "$script" ]; then
  echo "gate-shell: expected a step script path, got ${script:-<nothing>}" >&2
  exit 2
fi

log="$(mktemp -t gate-shell.XXXXXX)"

# `bash -e`, exactly GitHub's default. 2>&1 into the pipe so the summary
# carries the stderr a failure actually prints; the Actions log merges the
# two streams anyway, so nothing a reader sees changes.
bash -e "$script" 2>&1 | tee "$log"
status="${PIPESTATUS[0]}"

# A green step writes nothing. A green run's summary is noise, and noise in
# `output.summary` is worse than silence because it is read by tools.
if [ "$status" -ne 0 ] && [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### ✗ \`${GITHUB_JOB:-?}\` — exit ${status}"
    echo

    # WHAT RAN, because there is no env var naming the current step. The
    # script's own non-comment lines are the identification — for a
    # single-line step that is literally `bun run check:tools`.
    echo "<details><summary>the step</summary>"
    echo
    echo '````````sh'
    grep -vE '^\s*(#|$)' "$script" | head -40
    echo '````````'
    echo
    echo "</details>"
    echo

    # SAY SO when there was no output, rather than printing an empty fence.
    # `set -e` aborting on a bare `false` is exactly this case, and an empty
    # block reads as "the capture failed" — which is the one thing a reader
    # of this file must never have to wonder about.
    if [ -s "$log" ]; then
      # The tail, not the head: a gate that prints 400 green lines and then
      # one ✗ keeps the ✗. Bounded twice — GitHub caps a step summary at
      # 1 MiB and drops the WHOLE file when it is exceeded, so an unbounded
      # append loses the thing it was written for.
      echo "last 200 lines:"
      echo
      echo '````````'
      tail -n 200 "$log" | tail -c 60000
      echo '````````'
    else
      echo "The step printed nothing before failing — so the exit status above"
      echo "is the whole of what it reported. With \`bash -e\` that is typically"
      echo "a bare command returning non-zero rather than a gate's own verdict."
    fi
  } >> "$GITHUB_STEP_SUMMARY"
fi

rm -f "$log"
exit "$status"
