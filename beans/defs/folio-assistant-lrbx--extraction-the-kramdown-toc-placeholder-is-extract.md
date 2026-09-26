---
# folio-assistant-lrbx
title: 'EXTRACTION: the kramdown {:toc} placeholder is extracted as translatable prose, and translators dutifully translate it'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T13:22:39Z
updated_at: 2026-09-21T20:46:20Z
parent: folio-assistant-bzyu
---

Found while doing he0e (PR #691). `1. TOC` at docs/guides/agent-onboarding.md:20 is the list item kramdown REPLACES with the generated table of contents, immediately followed by `{:toc}`. Its text never reaches a reader in any language.

pot-extract.ts picks it up as a translatable string anyway, and the Arabic and Russian translators rendered it — ar has جدول المحتويات. That is a sensible human reading of a string that should never have been offered to them, and it cost real translator attention.

he0e worked around it: TOC is marked `#, localised` in every glossary, with a comment saying why, so translation-terms-preserved stops asking. That silences the symptom and records the cause; it does not fix it.

## Done when

- a kramdown attribute-list directive and the placeholder it consumes are not extracted as translatable strings;
- the existing TOC entries in ar/ru POs are obsoleted rather than left as live msgids;
- the TOC entry can come out of the five glossaries;
- checked against a folio other than this one, since extraction is shared by every instance.


## 2026-09-21 — fixed at the extractor, and the workaround came out

`pot-extract.ts` now drops the LIST a consuming kramdown directive replaces,
not just the directive line. The directive line was already skipped; the
placeholder above it was extracted before the parser ever reached it.

### The distinction the fix turns on, measured rather than guessed

Only `{:toc}` CONSUMES its block. Across this instance's docs the directive
vocabulary is `{: .fa-edit-source }` (276), `{: .note }` (232), `{:toc}` (38),
`{: .no_toc }` (38), `{: .fa-hx-dim }` (22) and others — every one of the rest
attaches attributes and leaves the block rendering. So `MD_KRAMDOWN_CONSUMING_RE`
matches the exact directive, never the substring: **`{: .no_toc }` is the near
miss**, since it is about the table of contents and sits beside a heading a
reader DOES see.

A RUN of items, not one item, because the directive attaches to the whole
list — a two-item placeholder would otherwise leak its second line. The run
ends at the first line that is neither an item nor a blank, so a `{:toc}`
further down a page cannot reach back and delete an unrelated list.

### The falsifier: does it delete prose a reader sees?

Swept all **1,902** committed `.md` files. **46 files use `{:toc}`, and exactly
46 placeholder items stop being extracted — one per file, every one `1. TOC`.
78,150 strings are still extracted.** Nothing else moved.

37 of those files are under `cat-harness/`, 9 under `fsh-guts/`, so it is not
one directory's quirk. **It is NOT the cross-folio check the last box asks
for** — this session cannot reach another folio repository, and two declared
directories in one repo is a weaker claim. Saying so rather than ticking it.

### Every `## Done when`

- [x] a kramdown attribute-list directive and the placeholder it consumes are
      not extracted — six tests, each asserted in BOTH directions
- [x] the ar/ru POs' TOC entries are OBSOLETED (`#~`), not deleted — the
      translations are kept in case the string ever returns, and
      `parsePoEntries` ignores `#~` because it looks for a line starting
      `msgid `. fr's empty entry obsoleted too.
- [x] the TOC entry is out of all five glossaries (`he0e`'s workaround, whose
      own comment said the real fix was filed separately — this is it)
- [ ] **checked against a folio other than this one** — not done, and cannot
      be from here. The 1,902-file sweep is the strongest available substitute.

### One honest side effect

Regenerating `fr/agent-onboarding.pot` also picked up a string that had
changed in the source since the POT was written on 2026-09-20 — the POT was
stale, independently of this. Coverage went 80/86 → 79/85 in ar and ru:
numerator and denominator both fall by one, because the string AND its
translation left together. The ratio is unchanged.

100/100 gates.
