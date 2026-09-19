---
# folio-assistant-gpuu
title: check:ci-health printed green while main was red — an unsettled newest run is dropped
status: todo
type: bug
created_at: 2026-09-19T00:59:13Z
updated_at: 2026-09-19T00:59:13Z
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
- [ ] `RunSummary` assessment keeps the newest run even when unsettled
- [ ] a row renders "newest run still in flight" / "head has not reported" rather than the older verdict
- [ ] the markdown path and the session-start sweep carry it too
- [ ] a test: a workflow whose newest run is `in_progress` over an older `success` must not render green

## Done when
A run of `check:ci-health` taken one minute after a breaking merge cannot print
a green row for the workflow that merge broke.
