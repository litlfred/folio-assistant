---
# folio-assistant-yqc4
title: 'CI observability: a failing e2e job is opaque to anyone who cannot reach the log host'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T13:56:51Z
updated_at: 2026-10-03T14:14:54Z
parent: folio-assistant-1xhc
---


## Brief

Owner, 2026-10-03: *"Have the workflow upload the Playwright report on failure — right
now a red E2E job is opaque to any agent that can't reach the log host."*

## The defect

A red `End-to-end + accessibility` job carried its diagnosis in exactly one place: the
run log, on `productionresultssa14.blob.core.windows.net`. A cloud session whose network
policy denies that host sees only the check run's annotation — `Process completed with
exit code 1` — and the run uploaded nothing. The `list` reporter writes to the log and
nowhere else, so there was no second copy of WHICH test failed.

Measured on PR #1949: shard 1/3 red twice at one commit, 823/823 and 275/275 green
locally, and no way from inside the container to tell which assertion CI disliked.

## The fix

- `playwright.config.ts`: on CI the reporter is `list` **plus** `html`, so a report
  exists to keep. Locally it stays `list` — nothing changes for a developer.
- `code-quality-gates.yml`: a `Keep the Playwright report` step, `if: failure()`,
  uploading `playwright-report/` and `test-results/` per shard.

`if-no-files-found: ignore` is deliberate: shard 1 runs `render:bpmn:check` BEFORE
playwright, so a failure there leaves no report at all. `error` would stack a second,
louder failure on the real one and point at the wrong step.

## Verified by forcing a failure, not by reading the docs

A throwaway spec was made to fail under `CI=1`. The report is written, and
`test-results/<test>/error-context.md` carries in PLAIN TEXT the test name, its file and
line, and the full `expect` diff. That file is fetchable from the artifacts REST API,
which is the whole point: it is readable where the log is not. The spec was removed.

## What this does NOT solve, stated because the incident proves it

**The failing step was not playwright.** It was `render:bpmn:check`, a shard-1-only step
that runs first — two stale BPMN SVGs, which is why the job died in 37 s having run no
tests. An artifact upload would not have explained that, and `regen` cannot catch it
either: it reports `render:bpmn:check` as OUTSIDE its fast set every run.

The general defect is wider than Playwright: **a failing step's output lives only in the
log**. The sharper fix is to write failure detail into `$GITHUB_STEP_SUMMARY`, which
surfaces in the check run's `output.summary` — an API field, readable without the log
host. Not done here; that is a decision about every job, not this one.

## Done when
- [x] an HTML report is produced on CI
- [x] it is uploaded on failure, per shard, and absent files do not add a second failure
- [x] proven by a forced failure that the artifact names the test and the error
- [ ] owner's call on whether failing steps should also write `$GITHUB_STEP_SUMMARY`


## The general case, now MEASURED on a job that is not Playwright

2026-10-03 14:14 UTC, same PR, a different gate: `Skill-registration chain,
unmasked (hard)` went red at 9505d0204. Asked from inside this container, the
check run gives:

    output.title    null
    output.summary  null
    annotations     failure: "Process completed with exit code 1."
                    notice:  (an unrelated ubuntu-latest deprecation notice)

and the log itself:

    GET productionresultssa12.blob.core.windows.net/.../job-logs.txt
    -> Forbidden

So the opacity is NOT Playwright-specific and not hypothetical. A gate whose
whole purpose is to name WHICH derived artefact went stale reported a bare exit
code, and the one place the name existed was a host this network policy denies.
AGENTS.md already says of this chain that "each stale artefact names a GENERATED
file rather than your skill, so the cause is invisible from the symptom" — and
here even that naming never arrived.

This is evidence for the open box below rather than a decision about it.
`$GITHUB_STEP_SUMMARY` would have carried the stale artefact's name into
`output.summary`, which is an API field and readable where the log is not. Still
the owner's call, because it is a change to every job in the workflow.

Worth saying plainly: the artifact upload this bean shipped would NOT have helped
here either. It is scoped to the e2e job, and a skill-registration failure writes
no Playwright report.
