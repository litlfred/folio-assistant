---
# folio-assistant-oja4
title: 'qa-sweep: replace script entries, not append'
status: completed
type: task
priority: normal
created_at: 2026-07-04T14:23:04Z
updated_at: 2026-08-07T11:24:59Z
---

## Summary of Changes

Already implemented and tested; the bean was left open, not the work.

`preserveNonScriptEntries` (qa-utils) is wired into all four write paths in
`qa-sweep.ts` (n/a, missing-dep, and verdict writes), so a script re-run
REPLACES the prior script entry while agent entries append and human entries
are always kept. `scripts/tests/qa-sweep-merge.test.ts` covers it — 9 tests,
including array-length stability across two sweeps and the
[script_stale, agent] -> [agent, script_fresh] ordering.

Empirically verified on qou rather than trusting the tests alone: 2765
sidecars scanned, only **2** criteria carry more than one script entry, and
both are on `proof-narrative-lean-equiv` — an `automated: false` criterion
that the current code never writes script entries for at all. So they are
legacy residue from before the fix, not an active leak.

No code change needed.
