---
# folio-assistant-6b8u
title: 'EXTRACTION: MD_MIN_TEXT_LEN is a threshold in CHARACTERS, so the same table cell is translatable in Arabic and not in English'
status: todo
type: bug
created_at: 2026-09-26T08:56:25Z
updated_at: 2026-09-26T08:56:25Z
parent: folio-assistant-bzyu
---

Found while deriving `.po` catalogues for #206 (bean `tbdg`). Measured
2026-09-26 on `main` + this branch.

`MD_MIN_TEXT_LEN = 3` in `content/pipeline/pot-extract.ts` gates every one of the
four emission paths (heading, paragraph, list-item, blockquote, table-cell). It is
a minimum in **characters**, used as a proxy for "is there translatable text
here". A character count is not script-neutral, so **the same table cell is
translatable in one language and not in another**.

## The mechanism, on a real cell from `docs/installation.md`

| | cell | after `cleanMarkdownText` strips code spans | extracted at min 3? |
|---|---|---|---|
| source | `` `pandoc`, `ripgrep` `` | `", "` (2) | no |
| `ar` | `` `pandoc`، و`ripgrep` `` | `"، و"` (3) | **yes** |

The Arabic comma `،` and the conjunction `و` are a correct localisation. They push
a code-only cell over a threshold English sits under. Verified directly:

```
extractMarkdown("| `pandoc`, `ripgrep` | conversions, search |") -> 1 entry
extractMarkdown("| `pandoc`، و`ripgrep` | التحويلات، والبحث |")  -> 2 entries
```

It runs the other way for dense scripts. `否` ("no") is 1 character and is
dropped; `non` and `нет` are 3 and are kept. So `fr` gains cells English lacks
while `zh` loses cells English has — **from the same table**.

## What it cost, measured

Of the 25 uncatalogued (page, locale) pairs in `tbdg`, re-running both sides with
the minimum at 1:

| | pairs |
|---|---|
| count mismatches that DISAPPEAR at min 1 | **7** of 16 |
| kind divergences that disappear at min 1 | **2** of 2 — both |
| still mismatched at min 1 (substantive) | 9 |

So **9 of the 18 refusals `derive-po.ts` reports are artefacts of this constant**,
not facts about the translations. Both kind divergences are — `fr/accessibility`
and `ru/getting-started` align exactly (`firstKindDivergence === -1`) once the
threshold is out of the way. Pinned as a regression test in
`derive-po.test.ts` §"a refusal is about the SHAPE".

It also means every existing `.pot`/`.po` pair in this repo has a msgid set that
depends on the locale's script, which is not what a catalogue is supposed to be.

## Why this was not just fixed

Changing it regenerates every `.pot` in the corpus and ADDS msgids to 19 existing
catalogues, which the drift gate will then read as untranslated. That is a
corpus-wide change with an owner-visible consequence, so it is put to the owner
rather than taken. `derive-po.ts` deliberately aligns against the extractor **as
shipped**, because every other consumer does.

## Done when

- [ ] the "is there translatable text here" test is script-neutral — a letter
      count (`\p{L}`) or a grapheme count, not a UTF-16 length — with the basis
      recorded on the constant
- [ ] MEASURED AFTER: the same cell extracts the same number of entries in every
      locale, and a CJK one-character cell is treated like its English counterpart
- [ ] every `.pot` regenerated with tooling, and the msgids the change adds are
      dispositioned in the 19 existing `.po` files rather than left as silent drift
- [ ] checked against a folio other than this one — extraction is shared by every
      instance
