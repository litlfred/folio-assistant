---
# folio-assistant-xom7
title: 'Workflow failure is invisible: docs-site failed 30 runs over two months unnoticed'
status: completed
type: bug
priority: normal
created_at: 2026-08-26T17:14:46Z
updated_at: 2026-08-26T17:21:43Z
---

Complement to 5rfy, not a duplicate. That bean fixed workflows that never FIRE
and added workflow-triggers.test.ts to keep headers honest about their on:
block. This is the opposite defect: docs-site.yml fired on every push to main,
failed all 30 times between 2026-06-29 and 2026-08-26, and nothing surfaced it.
The published site sat two months stale and the BPMN diagrams merged in #135
never reached it.

The trigger was fine. The OUTCOME was invisible. A green trigger and a red
result look identical from inside the repo, and GitHub's failure email is a
channel that evidently is not read.

The fix has to put the signal where attention already goes. This repo already
has one such place: the session-start surface every agent and human sees.

## Todo

- [x] A script that reports each workflow's health on the default branch:
      last conclusion, consecutive failures, days since last success
- [x] Degrade honestly with no network or no token — "could not check" must not
      read as "healthy"
- [x] Surface it in scripts/session-start-coord-sweep.sh, where beans already are
- [x] Tests for the classification logic, against fixtures (the API call itself
      is not the part that can be wrong quietly)

## Summary of Changes

`src/workflow/ci-health.ts` classifies each workflow's recent history on the
default branch; `scripts/check-ci-health.ts` fetches it in **one** API call
(`/actions/runs?branch=<default>&per_page=100` — fanning out per workflow would
exhaust the unauthenticated 60/hr limit and make it useless at session start);
`scripts/session-start-coord-sweep.sh` prints it beside the beans.

Two rules the report follows, both pinned by tests:

- **"Could not check" is never green.** An unreachable API renders as UNKNOWN,
  as loudly as a failure. A health check that goes quiet when it cannot see is
  worse than none, because it reads as reassurance — the same defect one level
  up from the one this bean is about.
- **Age separates a fire from a scorch mark.** A red that has not re-run in a
  week is flagged "may be stale" rather than as an active failure. Without this
  the report cries wolf, and a report that cries wolf earns exactly the
  inattention that let `docs-site` rot for two months.

Also: runs of a **deleted** workflow are filtered out (they are history, not a
problem), but only when the caller supplies a `workflowExists` predicate —
not knowing which files exist must not silently drop real failures.

## What it found on its first run

Immediately, without being asked:

- ✓ **Docs site — green.** First success since 2026-06-29, confirming the
  permissions fix.
- ✗ `.github/workflows/paper-builder-image.yml` — 2 failures, but the file was
  **deleted** from the tree. Filtered as history; this is what motivated the
  predicate.
- ✗ `witness-refresh.yml` and `qa-sweep.yml` — 2 failures each, both at the same
  instant on 2026-08-07 (one batch, not two independent breaks), both named by
  path rather than by `name:`, which is what GitHub does when a workflow fails
  to **parse**. Both files parse as YAML today and both were modified the next
  day (c1f3415), so these are very likely already fixed and simply have not
  re-run. That is exactly the case the staleness flag exists to describe, and
  it is why I did not "fix" them.

## Deliberately not done

Diagnosing `witness-refresh` and `qa-sweep`. This bean is about visibility, and
they now *are* visible, correctly characterised as 18-day-old and possibly
stale. Confirming whether they are fixed means dispatching them, which is an
Actions run and the owner's call. Worth a follow-up bean if they matter.

## The limit worth stating

This reports; it does not notify. A reader who never starts a session never sees
it. That is a real gap, and closing it means a scheduled job — which costs
Actions minutes the owner is deliberately avoiding. The session-start surface
was chosen because it is free and lands where attention already goes.
