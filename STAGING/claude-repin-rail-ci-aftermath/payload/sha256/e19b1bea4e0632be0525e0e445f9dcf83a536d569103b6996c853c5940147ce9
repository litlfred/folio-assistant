---
# folio-assistant-ybsz
$schema: bean/1.0.0
title: 'S6 standalone rehearsal: ho66, pyds, mer2 -> tndo -> zmdo, izqr, wggr'
status: todo
type: task
priority: normal
tags:
    - mvp
created_at: 2026-10-01T08:14:34Z
updated_at: 2026-10-09T17:46:42Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-txue
---

## Done when
- [ ] check:cat-harness-standalone green from a fresh sibling clone
- [x] mer2 instance-init split; tndo MVP defined; izqr bootstrap on empty repo
- [x] wggr stub inversion

## State 2026-10-09
Ticked: `mer2`, `tndo`, `izqr` and `wggr` are all `completed` in the store (checked 2026-10-09).
Box 1 is not met: `bun run cat check:cat-harness-standalone` run by me 2026-10-09 in the index checkout (cat-harness mounted at bd72c68, cat-harness-tools at 3ce5100, TMPDIR clean): **exit 1** — the 15-entry baseline (cat-harness-tools#16, after cat-harness#52) holds except **one new failure**: `scripts/tests/gen-slice-sqlite.test.ts > gen-slice-sqlite — kg > the whole-repo KG slices green, its pointers resolve to the COMMITTED payloads, and it stays under the budget`. That is the missing `harness-tiles` KG payload cat-harness-tools#16 already named as a defect of cat-harness main after #46/#49 that needs a payload regen in cat-harness. So the ratchet is one entry red at the current pin, and "green" here still means "holds the 15-entry baseline", not zero failures. Blocker `txue` is still open (8lcl, vj2p). Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
