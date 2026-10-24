---
# folio-assistant-ec2a
$schema: bean/1.0.0
title: 'LSI over blocks and Lean declarations: extend lsi-indexing with folio and lean-decl graph kinds and a cross-graph query'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T15:10:08Z
updated_at: 2026-10-24T09:35:00Z
parent: folio-assistant-zzmr
---

Recorded from the qou work-plan analysis, 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). Not started: recorded so the gap has an owner. lsi-indexing covers library, skills, beans, docs only. qou's 141 duplicate groups are mostly the same Lean declaration filed twice; a cross-graph index would let lsi:near say 'this bean is about block Y / declaration Z'. Block indexer belongs in folio-assistant-core, lean-decl in folio-assistant-sci.

## Owner ruling (2026-10-10, drain session ml9h)

**Accept scope, blocks first:** block indexer in folio-assistant-core first, then lean-decl kind in folio-assistant-sci, then cross-graph lsi:near.

## Progress 2026-10-12 (lane B; owner ruling: blocks first)
- Step 1 is done: folio-assistant-core#66 (merged) adds `scripts/lsi-blocks.ts`, LSI over content blocks keyed by `@id`. Each block's text depends on its kind: the section for prose, the narrative for a figure (476 units no section held), the label and headers for a table. Unreadable blocks and duplicate `@id`s are reported, not dropped.
- Measured: 4,549 blocks from 6 libraries, none unreadable, built in about 8 s. `--near` takes text or a block IRI.
- Remaining: step 2, a `lean-decl` kind in folio-assistant-sci; step 3, a cross-graph `lsi:near`.

## Progress 2026-10-12 16:00 (lane B)
Step 2 is done: folio-assistant-sci#18 (merged) adds `scripts/lsi-lean-decls.ts`, LSI over Lean declarations with ids `<qualified name>@<module>`. On qou's library it reads 45,092 declarations from 2,996 files in 189 s. 385 ids declared twice within one module are counted, not dropped. 5 tests pass. Step 3, a cross-graph `lsi:near` joining the two indexes, is still open.

## Claimed 2026-10-24 (cloud drain thread)

This thread is drafting step 3, the cross-graph `lsi:near`, as a design proposal first, with no code. No change here since lane B on 2026-10-12.
