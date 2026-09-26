---
# folio-assistant-wlyg
title: 'ROUND TRIP: pot-extract and po-inject declare ten copies of the same markdown constants, and one of them diverged inside a single change'
status: in-progress
type: task
priority: normal
created_at: 2026-09-26T10:03:23Z
updated_at: 2026-09-26T12:18:07Z
parent: folio-assistant-bzyu
---

Found 2026-09-26 while shipping `ig4a`, by asking whether anything else shared the
fact being changed before committing it.

`pot-extract.ts` (extract) and `po-inject.ts` (inject) are the two halves of one
round trip, and they parse markdown with **ten separately declared copies** of the
same constants:

| constant | identical today? |
|---|---|
| `MD_CODE_FENCE_RE` | **no — diverged, now consolidated** |
| `MD_FRONT_MATTER_DELIM` | yes |
| `MD_HEADING_RE` | yes |
| `MD_HTML_SKIP_OPEN_RE` | yes |
| `MD_HTML_CLOSE_TAG_RE` | yes |
| `MD_HLINE_RE` | yes |
| `MD_TABLE_SEP_RE` | yes |
| `MD_LIST_ITEM_RE` | yes |
| `MD_BLOCKQUOTE_RE` | yes |
| `MD_KRAMDOWN_ATTR_RE` | yes |

**Nine are identical, so there is no second bug to fix today.** Recorded anyway,
because the tenth is the evidence: `MD_CODE_FENCE_RE` was identical too, until
`ig4a` changed one of them. The duplication is not a latent risk in the abstract —
it produced a divergence inside a single change, and the only reason it did not
ship was that somebody grepped for a second copy.

This is the `v556`/`s8nu` shape (one fact with several homes) applied to the
thing whose two halves must agree by construction: **what the extractor treats as
a construct and what the injector treats as a construct are the same question.** A
grep is the only thing standing between them.

## Why this is a PREREQUISITE for `lvk9`, not a tidy-up

`lvk9` changes how list items and blockquotes are recognised — `MD_LIST_ITEM_RE`
and `MD_BLOCKQUOTE_RE`, both duplicated, and the continuation-line logic around
them. Doing that work against two copies is doing it twice, and the second copy
is the one nobody is looking at. Consolidate first, then `lvk9` has one place to
change.

## Done when

- [ ] the shared markdown-construct constants have ONE declaration, imported by
      both modules (the `MD_CODE_FENCE_RE` consolidation is the pattern)
- [ ] a test fails if either module re-declares one — the existing
      `derive-po.test.ts` §"both halves read ONE definition of a fence" generalised
      over the whole set rather than repeated per constant
- [ ] MEASURED AFTER: extraction over `cat-harness/docs/` yields byte-identical
      output, and `injectMarkdown` substitutes identically on the round-trip
      fixtures — this is a refactor and must be provable as one
- [ ] ordered before `lvk9` in the work plan

## Not in scope

Merging the two modules, or extracting a markdown parser. They do different
things and should stay separate files; only the constants they must agree on move.
