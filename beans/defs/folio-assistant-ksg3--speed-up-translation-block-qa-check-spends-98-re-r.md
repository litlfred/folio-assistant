---
# folio-assistant-ksg3
title: 'SPEED-UP: translation-block-qa --check spends 98% re-resolving the instance graph per (block, locale)'
status: in-progress
type: task
created_at: 2026-10-03T07:52:01Z
updated_at: 2026-10-03T07:52:01Z
parent: folio-assistant-hfag
---

Follow-up to `dlqu` (SPEED-UP 4), found while measuring its shard balancing.

Measured 2026-10-03: `translation-block-qa.ts --check` is 67 s of the 168 s
`gates that were registered and never run` step in CI (run 37090513935, job
111109661496) — the critical path of Code-quality gates once `dlqu`'s sharding
lands (bun test shard 2/4 is 150–194 s; that step's job 163–175 s). Balancing
the test shards alone buys nothing while this stands.

CPU profile locally (93 s wall, 106.6 s sampled): 104.3 s inside
`resolvePoSources`, of which 86.4 s is `orderedDependencies` →
`resolveInstanceGraph` and 12 s is `translationDir` → `directoryForGraph`. Both
answer a question about the FOLIO, and both were recomputed for every
(block, locale) pair.

## Done when
- [ ] the folio-level half of PO resolution (own translation dir, ordered deps with theirs) is computed once per sweep and passed in — not cached module-wide, since tests build and mutate fixture folios
- [ ] resolution unchanged: same sources, same order — tested
- [ ] measured before/after locally and in CI
- [ ] green on CI, PR ready
