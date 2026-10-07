---
# folio-assistant-vhqq
title: 'WORK PLAN DASHBOARD: 60 beans declare blocked_by but readBeans reads only blocking, so the dashboard misses most blocking edges'
status: completed
type: bug
priority: normal
created_at: 2026-10-03T12:05:24Z
updated_at: 2026-10-03T14:10:44Z
parent: folio-assistant-ahvw
---

Found 2026-10-03 by the q8ar slice builder. `grep -c '^blocked_by:' beans/defs/*.md` → 60 files; `cat-harness/scripts/beans.ts` readBeans reads only `blocking:` (7 beans). So `docs/assets/beans/index.json` and `work-plan.js` show a fraction of the real blocking graph — the 'could not determine' rendered as 'none' shape.

## Done when
- [x] readBeans reads both directions and normalises to one edge set (blocker → blocked), deduplicated
- [x] the published beans index carries the edges; the dashboard draws them
- [x] a test over the real corpus asserts the edge count equals the union of both declarations

## Summary of Changes

- `cat-harness/scripts/beans.ts`: the q8ar slice's per-declaration normalisation moved here as `declaredBlockEdges`; `blockEdges` folds it to ONE deduplicated `blocker → blocked` pair set with `declaredOn` and a `dangling` list. `blockedBy`, the new `blocksOf` and `beanFindings` read it. `gen-slice-sqlite.ts`'s `beanEdges` is now that same function.
- Measured 2026-10-03 over 720 beans: 7 edges from `blocking:`, 77 from `blocked_by:`, 1 declared both ways, **83** distinct (was 7 in the index). 2 dangling: `a1lq → 423d` and `ojcx → txut`, both blockers archived; kept in `edges` and reported as `blocking-unknown` findings.
- `folio-bean-index/v1` gains `edges` (`schemas/site-indexes.ts`); item `blocking`/`blockedBy` are the union.
- `work-plan.js`: the epic-row "blocked" badge now reads "blocked by <id>, …", each blocker linked; an unresolved one shown as "(unknown)". Rendered: 72 edges in 55 badges with all epics expanded, 0 page errors.
- Real-corpus test in `scripts/tests/beans.test.ts` parses front matter independently and asserts the edge set equals the union.
- Findings grew with the edges: blocked-without-expiry 5→59, blocker-closed 1→15, blocking-unknown 0→2. Expiry for a `blocked_by:` edge is looked for on the declaring (blocked) bean.
