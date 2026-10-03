---
# folio-assistant-fmdl
title: 'SPEED-UP: resolution-across-needs.test.ts spawns each kg-audit twice, serially — 92 s of the slowest shard'
status: in-progress
type: task
created_at: 2026-10-03T08:20:52Z
updated_at: 2026-10-03T08:20:52Z
parent: folio-assistant-hfag
---

Follow-up to `ksg3` (and `dlqu`): after both, the longest job in Code-quality
gates is `TypeScript — bun test, shard 2/4` at 223 s (shard 3/4: 68 s), measured
on #1950's run at `12ae9dc75`.

92 s of that shard is ONE file, `cat-harness/scripts/tests/resolution-across-needs.test.ts`
(per-file times from the shard's log). A shard moves whole files, so no
rebalancing can shorten it — the file itself has to.

Cause: it spawns `kg-audit --instance X --check --json` per instance in the
skill half, again in the role half, plus a default run — serially. One pass over
the 14 instances is 54 s locally (`./cat-harness` alone 16 s); the file took
123 s.

## Done when
- [x] each audit runs once (memoised by argument list) and they run side by side under a one-per-core limit — 123 s → 35 s locally, same 9 tests, same 23 expect() calls
- [ ] measured in CI
- [ ] green on CI, PR ready
