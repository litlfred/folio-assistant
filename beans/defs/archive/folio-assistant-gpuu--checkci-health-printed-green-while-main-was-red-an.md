---
# folio-assistant-gpuu
title: check:ci-health printed green while main was red — an unsettled newest run is dropped
status: completed
type: bug
priority: normal
created_at: 2026-09-19T00:59:13Z
updated_at: 2026-09-19T01:10:15Z
---

`check:ci-health` reported **green on `main` while `main` was red**, and I acted
on that report. Measured 2026-09-19.

## What happened

At 02:39 `17dc1e6` merged. At 02:40 PR #312 merged, fixing a `kg:audit:check`
failure that `main` had been carrying since `9601ccdf0` — a stale
`auditor.script_hash` in `skills/folio-core/kg-qa/kg-viewer.kg-qa.json`,
produced by two individually-green PRs whose merge was the broken state.

Between those two points I ran `bun run check:ci-health` against `17dc1e6` and
got:

    ✓ Code-quality gates      green
    ✓ Docs site               green
    ✓ JSON-LD drift           green

`main` was red at that moment. I then wrote, in the body of PR #315, that
"`main` is not red" and flagged the PR that was fixing it as mistaken. Both
claims were wrong and both are now merged into the history.

## The mechanism

`src/workflow/ci-health.ts:88`:

    const settled = runs.filter((r) => r.status === "completed" && ...)

In-flight runs are dropped before anything is assessed, so when the newest
commit's run has not finished — or has not started — the report answers with
the newest **settled** run, which can predate the breakage entirely. Nothing in
the output says the head has not reported.

## Why this is the tool's own class of defect

The three rules in AGENTS.md all exist to stop uncertainty rendering as green:
"could not check" is never green, a week-old red is flagged as possibly stale,
and a superseded red is named as superseded. A newest run that has not settled
is the same kind of uncertainty and is the one case not covered. The tool was
built for bean `xom7` — a red workflow that looked green from inside the repo —
and this is that defect arriving from the other direction.

## Proposed fix

Report the head's state as a **fourth state**, not as the last settled verdict:
when the newest run for a workflow is `queued` or `in_progress`, or when no run
exists for the current `HEAD` sha, say so on that row. The trend line
(consecutive failures, days since green) stays as it is — it is a trend report
and correct as one. What must change is that a reader cannot mistake it for an
answer about the commit in front of them.

## Todo
- [x] `RunSummary` assessment keeps the newest run even when unsettled
- [x] a row renders "newest run still in flight" / "head has not reported" rather than the older verdict
- [x] the markdown path and the session-start sweep carry it too
- [x] a test: a workflow whose newest run is `in_progress` over an older `success` must not render green

## Done when
A run of `check:ci-health` taken one minute after a breaking merge cannot print
a green row for the workflow that merge broke.

## Summary of Changes

`WorkflowHealth` gains `newestUnsettled`, set in `classifyRuns` whenever
`runs[0]` is not `settled[0]` — covering a run in flight, a queued run, and a
newest run that completed without a verdict (`cancelled`, `skipped`,
`neutral`).

**Deliberately not folded into `health`.** The existing `running` state means
"nothing has settled at all"; overloading it would erase the trend, and a
workflow red for six runs with a seventh in flight is still red. The verdict
stays a verdict; the new field says what it does not cover. `running` is
excluded from the flag so the same fact is never reported twice.

Both renderers changed. `render` lists each affected workflow by name above the
summary and suppresses "every workflow with a recent run on `main` is green" —
the exact sentence this bean was opened for — replacing it with "no settled
failures; N workflow(s) still reporting. Not 'all green' — the head has not
been judged." The CLI's console path swaps the tick for ⏳ and appends the
reason, because a reader scans the column of marks.

Seven tests in `scripts/tests/ci-health.test.ts`, each varying one thing from
the measured situation. **Verified they fail without the fix**: stashing the
two source files takes the file from 31 pass to 26 pass / 5 fail, and restoring
it returns 38 pass / 0 fail across both ci-health test files.

Also: `bunx tsc --noEmit` clean, `eslint` clean on all three files, and the full
`bun test` suite at 2009 pass / 0 fail.

**Not done, and not attempted:** the bean proposed also reporting when no run
exists for the current `HEAD` sha. That needs `head_sha` threaded through
`RunSummary` and the CLI resolving the branch head to compare against, which is
a larger change than the one that bit us — the run for the breaking commit had
started and was in flight, which is what this covers. Left for whoever wants
it, rather than half-built.
