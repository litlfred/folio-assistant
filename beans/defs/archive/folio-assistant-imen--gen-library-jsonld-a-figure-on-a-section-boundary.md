---
# folio-assistant-imen
title: 'GEN-LIBRARY-JSONLD: a figure on a section boundary is written four times to one path'
status: completed
type: task
priority: high
created_at: 2026-09-22T09:00:24Z
updated_at: 2026-09-22T09:33:36Z
parent: folio-assistant-2yyh
---

Found 2026-09-22 (issue #877, bean `3gef`) by the first `pdf-structure` library entry that also carries figures. Fixed the same day on the owner's ruling.

## The defect

`cat-harness/content/pipeline/gen-library-jsonld.ts` attributed each figure to every section whose page range contained its page. **Section page ranges overlap** — a section's `page_end` is the start page of the next one, inclusive. Measured on `smart-base/library/9789240093362-eng/` (the WHO PHC digital transformation handbook, 48 sections read from an embedded outline):

| page | sections containing it |
|---|---|
| 30 | 2 |
| 68 | 3 |
| **71** | **4** |

The node id is `figure-<imageId>` with no section qualifier, so all four emissions wrote to `blocks/figure-img-p071-1.jsonld` with a different `derivedFrom` each. Last write won, and `--check` reported the three losers as stale — **forever**, because re-running reproduced the same race. `bun run check:ci-invocations` and `gen:jsonld:check` both failed on it.

It needed BOTH an embedded outline and placed raster figures to surface, and no library entry had both until the WHO digital-health corpus arrived. The comment above the loop shows the single-page case WAS considered — *"A section with no `page_end` claims only its start page"* — and the overlapping one was not.

## The ruling

The owner chose **first containing section wins** (2026-09-22), over three alternatives put to them: keep last and merely deduplicate; strict-interior with boundaries to the earlier section; or emit once with several `derivedFrom`.

The reason it is first and not last: it matches reading order, so a figure introduced at the end of a section stays with the section that introduced it. Last is what the race happened to land on, which is not a reason.

## Summary of Changes

`sections` is in document order, so a `Set` of claimed figure ids makes "already claimed" mean "first containing section" with no extra ordering assumption.

**One consequence goes a step past the question as asked, and is recorded rather than slipped in:** ownership is now single in `contains` as well as in `derivedFrom`. The later section no longer lists a boundary figure. Listing it in both while deriving it from one would be internally inconsistent — a consumer walking `contains` across sections would meet the same block id twice with no way to tell a shared figure from a double count. The alternative was considered and rejected on that ground.

Regression test in `cat-harness/scripts/tests/gen-library-jsonld.test.ts`, four cases: written once, derived from the first containing section, an uncontested figure unaffected, and single ownership in `contains`. It uses the fixture that was already there — `sec-000` is pages 1–3 and `sec-001` is pages 3–8, so page 3 was always a boundary and the bug was always reachable from it.

Determinism verified by running `--check` twice: 2533 nodes up to date both times. `bun run gates` is 110 of 110.

## Done when
- [x] the owner has chosen among the four
- [x] `gen-library-jsonld.ts --check` is deterministic — re-running twice changes nothing
- [x] a regression test covers a structure-rung entry with a figure on a section boundary
