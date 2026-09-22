---
# folio-assistant-imen
title: 'GEN-LIBRARY-JSONLD: a figure on a section boundary is written four times to one path'
status: todo
type: task
priority: high
created_at: 2026-09-22T09:00:24Z
updated_at: 2026-09-22T09:00:24Z
parent: folio-assistant-2yyh
---

Found 2026-09-22 (issue #877, bean `3gef`) by the first `pdf-structure` library entry that also carries figures.

## The defect

`cat-harness/content/pipeline/gen-library-jsonld.ts` attributes each figure to every section whose page range contains its page:

```ts
const from = sec.page_start ?? undefined;
const to = sec.page_end ?? sec.page_start ?? undefined;
if (from !== undefined && to !== undefined) {
  for (let pg = from; pg <= to; pg++) {
    for (const img of figuresByPage.get(pg) ?? []) {
      const bid = `figure-${img.id}`;
      out.push({ path: `blocks/${bid}.jsonld`, content: node({ /* … derivedFrom: this section */ }) });
```

**Section page ranges overlap**, because a section's `page_end` is the start page of the next one, inclusive. Measured on `smart-base/library/9789240093362-eng/` (the WHO PHC digital transformation handbook, 48 sections read from an embedded outline):

| page | sections containing it |
|---|---|
| 30 | 2 |
| 68 | 3 |
| **71** | **4** |

The node id is `figure-<imageId>` with no section qualifier, so all four emissions write to `blocks/figure-img-p071-1.jsonld` with a different `derivedFrom` each. **Last write wins**, and `--check` then reports the three losers as stale — forever, because re-running reproduces exactly the same race.

That is why `bun run check:ci-invocations` fails on `gen-library-jsonld.ts --check` with 8 stale nodes across 5 distinct paths.

## Why it was not seen before

It needs BOTH an embedded outline (so sections have real ranges rather than one page each) AND placed raster figures. The comment above the loop shows the single-page case was considered — *"A section with no `page_end` claims only its start page"* — and the overlapping case was not. Every earlier library entry is page-granular, where each section is one page and no overlap is possible.

So the output is not merely stale, it is **non-deterministic in principle**: which section owns a boundary figure is decided by section iteration order rather than by a rule.

## NOT fixed here, because the fix is a judgement and not a typo

Deduplicating by path is easy; deciding WHICH section owns a figure on a boundary page is not, and the choice propagates into the graph:

1. **First containing section wins** — deterministic, matches reading order, and a figure introduced at the end of a section stays with it.
2. **Last containing section wins** — what the code accidentally does today, so it changes nothing that is already written.
3. **Strict interior first, boundary to the earlier section** — closest to how a person reads a page break, and the most code.
4. **Emit once with several `derivedFrom`** — most faithful, but `derivedFrom` is currently a single IRI, so it is a schema change with its own consumers.

`6xaz`'s rule is the frame: a structure that could not be determined is never rendered as one that was. A figure sitting on a boundary genuinely belongs to two sections, and picking one silently asserts otherwise.

The owner's standing rule is that speculative code changes need explicit consent, so this is reported with a proposed patch rather than pushed.

## Done when
- [ ] the owner has chosen among the four
- [ ] `gen-library-jsonld.ts --check` is deterministic — re-running twice changes nothing
- [ ] a regression test covers a structure-rung entry with a figure on a section boundary
