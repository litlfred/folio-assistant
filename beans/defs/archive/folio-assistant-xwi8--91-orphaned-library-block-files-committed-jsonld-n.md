---
# folio-assistant-xwi8
title: '91 ORPHANED LIBRARY BLOCK FILES: committed .jsonld no section references — keep or prune?'
status: completed
type: task
priority: normal
created_at: 2026-09-23T07:30:19Z
updated_at: 2026-09-23T11:48:23Z
parent: folio-assistant-slw1
---

Found by bean `zaqn`. `gen-library-jsonld` reports 91 orphaned block files ("referenced by no section … Remove with --prune, once you have looked"):

| document | files |
|---|---|
| smart-base/library/9789240093362-eng | 47 |
| agent-skills/library/arxiv-2608.08453v1 | 20 |
| agent-skills/library/arxiv-2607.25032v1 | 12 |
| cat-harness/library/arxiv-2508.05192v2 | 12 |

About 364 KB total; last touched 2026-09-22/23.

`zaqn` REWROTE their `folio:` terms in place (owner's choice, 2026-09-23) so the prefix gate passes — it did not delete them. Deleting is a person's decision (deletion-requires-confirmation).

## Root cause (measured 2026-09-23)

**Two writers, two naming rules for one block.** `scripts/l1-blocks.ts` minted
`prose-${section id}` (`prose-sec-001-introduction`); `gen-library-jsonld.ts`
mints `prose-sec-001` via `sectionKey()`, and only the generator's names are
referenced by a section node. Every document run through both carried a second
copy of every prose block.

- **All 91 of 91** orphans are byte-identical to their referenced twin apart
  from the last `@id` segment (same `library/<doc>/` prefix, same title, pages,
  and `text` link to the section `.md`, which resolves).
- **Nothing references them**: no long id appears anywhere outside `blocks/`,
  and none appears inside `blocks/` beyond its own `@id`.
- The arm's manifest also listed section nodes by the long id
  (`sections/sec-001-introduction`), which the generator overwrote.
- History: smart-base's long names landed at `56bf8b77` (wkt1), the short ones
  nine minutes later at `a8ef9fd7` (7mi0); arxiv-2508 got both in #989.
- #1050 wires `l1-blocks.ts` into `ingest` itself, so without this fix the
  duplicates would appear on EVERY ingest.

## Todo

- [x] `l1-blocks.ts` imports the generator's `blockId()` + `sectionKey()` — one naming rule, for blocks and for the manifest's section refs
- [x] test runs BOTH writers on one staged entry and asks the generator's own `orphanedBlocks()`; falsified against the old writer (3/3 fail)
- [x] bun run gates green (135/135); issue #1066; PR opened
- [x] owner decided (2026-09-23): delete the 91 in #1067. Deleted with `git rm` from a computed list — NOT `--prune`, which by then would have removed 113 (see below). Each file re-checked identical to its twin immediately before deletion; the four documents now report 0 orphans; gates 135/135.
- [x] owner decided (2026-09-23): delete the 22 further duplicates in `cat-harness/library/arxiv-2312.07755v1` too (they appeared on main after the 91 were measured). Same procedure; the WHOLE repository now reports 0 orphaned blocks.

## Done when

`gen-library-jsonld` reports 0 orphaned block files.

## Summary of Changes

PR #1067, issue #1066.

- **Root cause fixed:** `scripts/l1-blocks.ts` now uses the generator's own `blockId()` + `sectionKey()` for block ids and for its manifest's section refs — one naming rule, so the two writers cannot drift apart again.
- **Test:** `scripts/tests/l1-blocks.test.ts` runs BOTH writers on one staged entry and asks the generator's `orphanedBlocks()`; all 3 tests fail against the old writer.
- **113 duplicates deleted, each on the owner's word:** first the 91 measured in four documents, then 22 more in `arxiv-2312.07755v1` that appeared on main meanwhile. Removed with `git rm` from computed lists, never `--prune` (which deletes whatever it reports, approved or not). Each re-checked identical to its referenced twin and referenced nowhere, immediately before deletion.
- The repository reports **0 orphaned blocks**.
- Also regenerated two `kg:audit` sidecars (`content-graph`, `review-heatmap`) that main left stale in #1060 — `kg:audit:check` was red on main itself.
