---
# folio-assistant-fg6z
title: 'QA staleness: 18 automated criteria have no locatable dispatcher'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:36:22Z
updated_at: 2026-09-18T17:43:01Z
---

## What

`scripts/tests/qa-criterion-source-file.test.ts` (added with bean `b7yo`)
pins that every automated criterion's declared `source_file` is the file
that actually dispatches it. It found and fixed **11** mis-pointed criteria.

It also found **18** automated criteria whose dispatcher the test's string
probe cannot locate at all. Those are currently pinned with
`toBeLessThanOrEqual(18)` — a baseline, not an endorsement.

## Why it matters

`source_file` is what `script_hash` is computed over, and `script_hash` is
the only thing that makes a cached sidecar verdict go stale. A criterion
pointed at the wrong file never invalidates: its verdicts stay "fresh"
forever and editing the real checker changes nothing.

For the 11, that was measurable and is fixed. For these 18, **it is not
established either way** — the probe fails to find their dispatcher, so the
test cannot tell whether their `source_file` is right or wrong. The
`<= 18` assertion only guarantees the unknown set does not grow.

## The work

Identify how each of the 18 is dispatched. Likely several distinct cases:
a dynamic dispatch table, a checker registered by a different mechanism, or
criteria that are `automated: true` but dispatched from somewhere the
candidate list does not include. For each, either extend the probe so the
test covers it, or record why it genuinely cannot be covered.

Then tighten the assertion. A baseline that never moves is a baseline
nobody is working on.

## Verification gate

The number goes down and the `mismatched` assertion stays empty. If
tightening the probe reveals new mismatches, those are real findings of the
same class as the 11 — fix them, do not raise the baseline.

## Provenance

Measured 2026-09-18 by `bun test scripts/tests/qa-criterion-source-file.test.ts`
on the branch for `b7yo`. Not re-measured since.
