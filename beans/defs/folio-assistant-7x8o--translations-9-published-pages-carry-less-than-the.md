---
# folio-assistant-7x8o
title: 'TRANSLATIONS: 9 published pages carry LESS than their source — zh short on all five, and es/ru accessibility short by the same 13'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T08:57:09Z
updated_at: 2026-09-26T09:20:41Z
parent: folio-assistant-bzyu
blocked_by:
    - folio-assistant-lvk9
---

Found while deriving `.po` catalogues for #206 (bean `tbdg`). Measured
2026-09-26.

`derive-po.ts` refuses 18 of 25 (page, locale) pairs because the published
translation does not have the same SHAPE as its source. **9 of those 18 are
artefacts of the extractor** (beans `6b8u` and `ig4a`) and disappear once the
threshold is script-neutral. These are the **other 9**, which are still mismatched
with the threshold out of the way — the translation genuinely carries less
content than its source.

## The 9, with the delta that survives a min-1 re-extraction

| pair | source | translation | at min 1 |
|---|---|---|---|
| `es/accessibility` | 130 | 117 | 130 / 117 |
| `ru/accessibility` | 130 | 117 | 130 / 117 |
| `zh/accessibility` | 130 | 111 | 130 / 117 |
| `ru/content-types` | 117 | 111 | 118 / 113 |
| `zh/content-types` | 117 | 95 | 118 / 107 |
| `zh/contributing` | 21 | 17 | 21 / 18 |
| `ar/getting-started` | 165 | 163 | 175 / 174 |
| `zh/getting-started` | 165 | 147 | 175 / 167 |
| `zh/installation` | 65 | 58 | 61 / 59 |

## Two patterns, not nine accidents

**`zh` is short on all five pages** — every `zh` page is in this list, and by the
largest margins (22, 19, 18, 7, 4). One producer, one systematic behaviour, not
five independent omissions.

**`es/accessibility` and `ru/accessibility` are short by the SAME 13**, both
landing on exactly 117. Two locales agreeing to the entry on what to leave out is
a shared cause — most likely one truncated source handed to both.

The content that goes missing is not decoration. An LCS alignment over kinds names,
among others, a whole blockquote of `accessibility.md`:

> *"so that the cheapest possible answer is still a complete one."*

and, from the same page, *"published folio has alt text, correct heading order or
table headers"* — on an **accessibility** page, in three of five locales.

## Why this is the finding the missing catalogue was HIDING

`translation-drift` could only ever report "published with no `.po` catalogue" on
these pages. The absence was **masking** a content divergence, so the red gate in
`tbdg` was *under*-reporting rather than over-reporting: the remedy is not 27
catalogues, it is 7 catalogues plus this.

## Why this is not an agent's call

Whether a short translation is corrected against its source or re-translated is a
content decision, and #206 reserves adjudication of translations to a human —
official means a person signed off. An agent re-translating nine pages to make a
gate green would be manufacturing the sign-off the issue exists to protect.

## Done when

- [ ] the owner has said, per pattern rather than per page, whether the `zh` set
      is corrected or re-translated, and the same for the `es`/`ru`
      `accessibility` pair
- [ ] the cause of the shared 13-entry `es`/`ru` shortfall is identified — one
      truncated source, or two — before either is re-translated
- [ ] the accessibility-page omissions are restored first, ahead of the rest
- [ ] MEASURED AFTER: `derive-po.ts` refuses 0 of these 9 (with `6b8u`/`ig4a`
      landed), so `translation-drift` reports on real catalogues for all 25


## CORRECTION, same day — this bean's PREMISE is wrong for most of it

The owner's instruction was to **diagnose the cause before touching any
translation**. Diagnosing it refuted the bean.

This bean says *"the translation genuinely carries less content than its source"*
and treats the `es`/`ru` `accessibility` pair agreeing on exactly 117 as *"a shared
cause — most likely one truncated source handed to both"*. **It is a shared cause,
and it is not that.** It is bean `lvk9`: `extractMarkdown` emits list items and
blockquotes ONE ENTRY PER LINE, so how many entries a construct yields depends on
where the author pressed return, and no translator preserves an English hard wrap.

The evidence that settles it — `es`, `ru` and `zh` diverge at **the same three
source indices, 5, 11 and 78**, and all three land on exactly 117. At source[3]:

| | |
|---|---|
| source `[3]` list-item | *"What are the options for forcing agentic Q&A into guided questions that"* |
| source `[4]` paragraph | *"follow DMN logic and can serve several interaction modalities?"* |
| `es` `[3]` list-item | the whole sentence as one entry |

One wrapped English sentence, split by the extractor into a list-item plus a
paragraph. The Spanish is not wrapped, so it is one entry. **Nothing was
truncated and nothing was omitted.**

Measured with wrapped list items and blockquotes coalesced: alignment goes 10/25
→ **17/25**, and all three `accessibility` pages align. So of the 9 pairs listed
above, **7 are not this bean's** — including every one that carried the strongest
prose in it.

### The accessibility claim was the worst of it, and it was false

This bean said, of a missing blockquote and *"published folio has alt text,
correct heading order or table headers"*:

> *"on an **accessibility** page, in three of five locales"*

That was written to make the finding land, and it was wrong — both strings are
present in all three translations. They looked absent because an LCS alignment
over KINDS alone picks an arbitrary pairing among equal-kind runs, so it named
whichever entry the walk happened to fall out of step on rather than a missing
one. A diagnostic that cannot say WHICH entry is extra must not be quoted as
saying which entry is missing, and this bean quoted it that way.

### What is left

8 pairs, after `lvk9`: `ru`/`zh` `content-types`, `ar`/`es`/`fr`/`ru`/`zh`
`getting-started`, `zh` `installation`. `zh` is still over-represented among them,
so the `zh` question may survive in smaller form — but it is now **4 of 8 rather
than 5 of 5**, and it is not established as a content problem at all until `lvk9`
lands and the remainder is re-measured.

**Blocked on `lvk9`**, and no translation should be corrected or re-translated
before it: on the evidence so far, most of what looked like missing content is the
extractor's wrap sensitivity, and re-translating against it would change good
translations to match a defect.
