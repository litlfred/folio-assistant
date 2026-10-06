---
# folio-assistant-7te5
title: who-iris's 12 generated pages are counted as authored — gen-iris-pages marks nothing it writes
status: todo
type: bug
created_at: 2026-10-04T06:25:09Z
updated_at: 2026-10-04T06:25:09Z
parent: folio-assistant-0lmb
---


Found by running bean `06e3`'s who-iris exercise end to end, 2026-10-04 (PR #2049).

## The measurement

`check:docs-populated` reports for who-iris:

> `✓ who-iris   who-iris/docs/kg-to-portal.html — 1491 words of prose`
> `  14 authored, 0 generated  ·  who-iris/docs, who-iris/site`

The true split of those 14 pages is **2 authored, 12 generated**:

| writer | pages |
|---|---|
| `who-iris/scripts/gen-iris-pages.ts` | 12 |
| `bootstrap-tools/scripts/subgraph-readmes.ts` | 2 |
| a person | **2** — `who-iris/docs/style-guide.md`, `style-guide-agents.md` |

Corroborated independently: bare `bun run iris:pages:check` exits 0 with
`12 page(s) up to date, no orphans.`

**The evidence page the check names — `kg-to-portal.html` — is one of the
twelve.** This is the defect `06e3` records closing for `gen-docs-pages.ts` on
2026-09-21 (*"The check was passing the harness on documentation nobody
authored, and neither the check nor anything else could have known"*), still
live in a different generator.

## Two separate gaps, and they have different homes

`GENERATED_MARKERS` (`cat-harness/scripts/check-docs-populated.ts:136`) is three
anchored patterns: `^var SCOPE = "…";$`, `Do not hand-edit`, `— do not edit here.`

1. **`gen-iris-pages.ts` marks nothing it writes.** Its 12 pages are
   byte-indistinguishable from authored HTML. The fix is the one `06e3` already
   applied to `gen-docs-pages.ts`: an HTML comment carrying the same phrase
   every other generator here uses, naming the source to edit rather than the
   output. In-repo, small.
2. **`subgraph-readmes.ts` DOES mark, twice, and matches none of the three.** It
   writes *"— do not edit; change that entry"* and *"Do not edit it here;"*.
   **It lives in the `bootstrap-tools` SUBMODULE**, so this is a cross-repo
   change, not an edit here. Decide whether the marker wording moves to it or
   whether `GENERATED_MARKERS` gains its phrasing — one answer, not two.

## Why it matters beyond the one count

`gen-docs-auto.ts`'s `index/docs` type imports `classify` from this module
*"rather than re-derived"*, deliberately and correctly. So one wrong answer
reaches both: `/cat-harness/docs-auto/index/docs/who-iris-docs/` lists 6 rows of
which 4 are derived, and `…/who-iris-site/` lists **8 of 8 derived under a
heading promising "every AUTHORED documentation page"**.

## Done when

- [ ] `gen-iris-pages.ts` marks every page it writes, with the same phrase the
      other generators here use
- [ ] the `subgraph-readmes.ts` wording question is decided and recorded — a
      marker is a CONTRACT between a writer and a reader, and two spellings is
      two contracts
- [ ] `check:docs-populated` reports who-iris as 2 authored / 12 generated, and
      names an authored page as its evidence
- [ ] `index/docs` lists only authored pages for both who-iris sub-graphs

## What NOT to assume while fixing it

**The verdict is right by accident and must stay right.** With the 12 excluded,
who-iris still passes `check:docs-populated`: `style-guide.md` is 558 prose
words and `style-guide-agents.md` 347, both over `MIN_PROSE_WORDS` (250). Only
the evidence changes. A fix that turns the harness red has over-corrected.
