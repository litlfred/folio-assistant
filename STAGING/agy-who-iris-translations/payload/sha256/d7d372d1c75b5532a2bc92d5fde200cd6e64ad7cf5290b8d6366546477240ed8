---
# folio-assistant-wlyg
title: 'ROUND TRIP: pot-extract and po-inject declare ten copies of the same markdown constants, and one of them diverged inside a single change'
status: completed
type: task
priority: normal
created_at: 2026-09-26T10:03:23Z
updated_at: 2026-09-26T13:48:19Z
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

- [x] the shared markdown-construct constants have ONE declaration, imported by
      both modules (the `MD_CODE_FENCE_RE` consolidation is the pattern)
- [x] a test fails if either module re-declares one — the existing
      `derive-po.test.ts` §"both halves read ONE definition of a fence" generalised
      over the whole set rather than repeated per constant
- [x] MEASURED AFTER: extraction over `cat-harness/docs/` yields byte-identical
      output, and `injectMarkdown` substitutes identically on the round-trip
      fixtures — this is a refactor and must be provable as one
- [x] ordered before `lvk9` in the work plan

## Not in scope

Merging the two modules, or extracting a markdown parser. They do different
things and should stay separate files; only the constants they must agree on move.


## 2026-09-26 — done, and it found a live asymmetry on its way

### The move, proven rather than asserted

All ten shared constants now have ONE declaration in `pot-extract.ts`, imported by
`po-inject.ts`. Byte-exact baseline over both halves — every entry
`extractMarkdown` yields across all 618 files of `cat-harness/docs` (source, line,
kind, msgid), plus `injectMarkdown`'s `changed`, stats and output hash for every
real (catalogue, source) pair: **45410 lines, identical**.

The test is generalised over the whole set rather than repeated ten times, and it
asserts *the injector DECLARES none of these* — the failure mode is a
re-declaration appearing, and a test checking only the import line would pass with
both present. Two anti-vacuity guards: the injector must still USE each name, and
each must really be an `export const` in the extractor.

### What it found — a 468-occurrence asymmetry THIS PR had introduced

`po-inject` gated substitution on `msgid.length < MD_INJ_MIN_LEN` — **3
characters** — while `6b8u` had just moved the extractor to a count of **letters**.
Same question from two ends, two answers.

Measured over `cat-harness/docs`: **468 occurrences of 46 distinct msgids** were
extracted, offered to translators, and structurally **un-injectable**.

| locale | stranded occurrences |
|---|---|
| (source) | 430 |
| `zh` | **23** |
| `es` | 6 | 
| `ar` | 4 |
| `ru` | 3 |
| `fr` | 2 |

The `zh` ones are ordinary two-character words — 原因, 标准, 选项, 代价 — which is
**exactly the population `6b8u` existed to stop dropping**. It rescued them on the
extract side and stranded them on the inject side, which is this bean's thesis
demonstrated at my own expense.

Fixed by importing `isTranslatable` rather than restating it. Measured effect, in
two directions and both right:

- **A real translation rescued.** `ar/accessibility` gains a substitution:
  `"do"` → `"ما يجب فعله"`, a table header that had been un-injectable.
  `fr/accessibility` likewise.
- **Bogus span counts corrected.** `ar`/`es`/`fr` `content-types` drop 3 counted
  spans each and `fr/crdm-methodology` drops 6, with output hashes UNCHANGED — they
  were counted as translatable and never could be, so the coverage denominator was
  inflated.

Sidecars regenerated with tooling and verified one check at a time.

### Where the canonical checklist stands

All four ticked above. Recorded as prose rather than as a second ticked list,
because the first version of this entry appended exactly that and
`check:bean-bodies` rejected it — the `bbbl` shape, and **the third time in one
session** I have written it. Worth naming: `beans update --body-append` makes a
ticked status block the natural thing to write, so the rule is not broken by
carelessness about the rule but by the shape of the tool. The gate is the thing
that holds, which is why it exists.
