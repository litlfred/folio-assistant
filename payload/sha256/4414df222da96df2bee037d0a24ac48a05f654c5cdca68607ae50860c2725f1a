---
# folio-assistant-lvk9
title: 'EXTRACTION: list items and blockquotes are extracted PER LINE, so a msgid depends on the author''s hard wrap — translators get sentences in halves'
status: completed
type: bug
priority: normal
created_at: 2026-09-26T09:20:19Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-bzyu
blocked_by:
    - folio-assistant-wlyg
---

Found 2026-09-26 while diagnosing bean `7x8o` at the owner's instruction to find
the cause before touching any translation. **It is the third and largest member of
the `6b8u`/`ig4a` family, and it refutes most of `7x8o`.**

`extractMarkdown` accumulates a PARAGRAPH until a blank line, so a hard-wrapped
paragraph is correctly one entry. **List items and blockquotes are not
accumulated** — each matches per line:

```ts
const listMatch = line.match(MD_LIST_ITEM_RE);   // one entry per line
const bqMatch   = line.match(MD_BLOCKQUOTE_RE);  // one entry per line
```

So the number of entries a construct yields depends on **where the author pressed
return**, and a wrapped list item's continuation line does not even come out as a
list item — it falls through to the paragraph accumulator and is emitted as a
`paragraph`. Wrong count and wrong KIND from one cause.

## Translators are being given sentences in halves

This is the part that matters more than any count. Real msgid pairs from
`cat-harness/docs/`, each ONE sentence in the source:

| | msgid |
|---|---|
| `tool-graph.md` | *"**An actor performs a task in a process as a role, using that role's ski…"* |
| | *"and a tool is one concrete way to exercise one.**"* |
| `document-ingestion.md` | *"contradictions in the source are recorded as data, never silently resolv…"* |
| | *"by picking one;"* |

Note the `**` opening in one msgid and closing in the next. A translator cannot
render either half correctly, and no word order that differs from English can be
produced at all. Bean `lrbx` established that offering a translator a string that
should never have been offered *"cost real translator attention"*; this is the
same cost, at scale, on strings that are real but truncated.

## Measured — this is the big one

Coalescing what the source's wrap split apart, over the 25 (page, locale) pairs
of `tbdg`:

| | aligned |
|---|---|
| after `6b8u` + `ig4a` (shipped) | 10 / 25 |
| + blockquotes coalesced | 13 / 25 |
| + wrapped list items coalesced | **17 / 25** |

Corpus-wide: **343 of 618** files change, msgids **45272 → 41487** — 3785 merged
away, about 8 % of the corpus.

## It refutes `7x8o`'s premise for 7 of its 9

`7x8o` recorded *"9 published pages carry LESS than their source"*, and made much
of `es`/`ru` `accessibility` being short by *"the same 13"*. Diagnosed: `es`, `ru`
AND `zh` all diverge at **the same three source indices — 5, 11 and 78** — and all
three land on exactly 117. Three locales agreeing to the entry is one cause, and
it is this one. At source[3]/[4]:

| | |
|---|---|
| source `[3]` list-item | *"What are the options for forcing agentic Q&A into guided questions that"* |
| source `[4]` paragraph | *"follow DMN logic and can serve several interaction modalities?"* |
| `es` `[3]` list-item | the whole sentence, as one entry |

The English is wrapped and the Spanish is not. **The translations were never
short.** All three accessibility pages align once wrap is out of the way, and
`7x8o` is corrected accordingly — 8 pairs remain, needing their own diagnosis.

## NOT a one-line fix, and my measurement is a lower bound

The rule used to measure this — merge an entry into its predecessor when it sits
on the immediately next line — **over-merges**, and that is visible in its own
output: in `wireframes/fsh-guts/intent.md` it joined *"the Declared kinds fan"* to
*"Its back control is \"‹ All actions\"."*, which are two different sentences. A
correct fix has to do what markdown does — recognise a continuation by its
INDENTATION against the list marker's column, and end the item at a blank line or
a new marker — rather than by line adjacency. So the 17/25 above is what a crude
rule reaches, not what a correct one would, and the two numbers should not be
quoted as one.

That is also why this was not folded into the `6b8u`/`ig4a` PR: those were one
line each with a measured effect in both directions, and this is a parser change.

## Done when

- [x] a list item is one entry however it is wrapped, with continuation lines
      recognised by indentation, ending at a blank line or the next marker
- [x] a blockquote is one entry per blockquote, not per line
- [x] MEASURED AFTER: no msgid is a clause fragment — specifically, no pair of
      adjacent msgids where the first opens a `**` span the second closes
- [x] MEASURED AFTER: re-wrapping a source paragraph, list item or blockquote
      changes NO msgid — the property that makes a catalogue survive an edit
- [x] the msgids this merges away are obsoleted in the existing `.po` files with
      tooling, not dropped. **41, not 3785** — see the measurement below; the
      tooling is `bun run translation:obsolete`, gated by
      `translation:obsolete:check`.
- [x] `7x8o` re-measured afterwards; expect 8 pairs or fewer to remain
- [x] checked against a folio other than this one — extraction is shared.
      `litlfred/qou`, 150 markdown files, pre-`lvk9` extractor vs now. It found
      bean `o29r`, a pre-existing underscore defect `lvk9` widens.


### From bean `f6r1` — check the INJECT side too

`f6r1`'s roundtrip control failed on known-good catalogues because
`injectMarkdown` *"collapses a multi-line paragraph onto its first line and blanks
the continuations, so re-extraction legitimately re-segments"*. Same hard-wrap
sensitivity, from the injecting half. A fix that makes a msgid survive a re-wrap on
the extract side must be checked against inject as well, or the round trip stays
non-identical for a new reason. Adds to `wlyg`'s case for one definition.


## 2026-09-26 — extract half done. Drift 25 → 5, and the crude rule UNDERSOLD it

`extractMarkdown` now accumulates list items and blockquotes the way it already
accumulated paragraphs, with continuation decided by **indentation against the
marker**, ending at a blank line or the next block — what markdown says, rather
than the line adjacency used to size this bean.

| | derived / 25 |
|---|---|
| before `6b8u` + `ig4a` | 7 |
| after those two | 10 |
| **after this** | **19** |

**19, not the 17 the crude rule predicted.** That rule both over-merged (joining two
unrelated sentences in `intent.md`) and under-merged, so its 17 was never a ceiling
— which is why this bean recorded it as "a crude rule's reach rather than a
promise" rather than as a target. `translation:drift:check`: **25 → 5** findings,
against 25 on `main`.

All five locales of `accessibility` now align at 117 entries and all five of
`content-types` at 99 — `zh` included, the locale that looked "systematically
short" throughout.

### What the remaining 6 refusals turned out to be

Five are ONE cause, and it is not the translators: **`installation` × 5 locales,
each short by exactly 2.** Those two are the Windows/Git Bash paragraphs `main`
added to `docs/installation.md` on 2026-09-26, after the translations landed.
Verified at source `[32]`/`[33]`, where every translation jumps to the next
heading. That is #206's own **stale-on-edit** case — the source moved — and
refusing is correct, since a translation cannot be aligned against a source that
grew.

The sixth is `zh/getting-started`, short by 4, and it is the only remaining
candidate for a genuine content shortfall in the whole corpus.

So `7x8o`'s claim — *"9 published pages carry LESS than their source"* — resolves
to **one pair worth investigating**, with five explained by source staleness and
the rest by three extractor defects.

### The falsifier, run rather than asserted

Six property tests: the same content wrapped two ways must yield **equal msgid
sequences**, for a list item (one line vs two, two vs three), a blockquote, and an
emphasis span broken by the wrap; a paragraph as the control; plus an
anti-vacuity floor so equal-and-empty cannot pass. And the two guards against
over-merging: an UNINDENTED following line is a new paragraph, a bare `>`
separates two quoted paragraphs, and a change of quote depth starts a new entry.

Corpus-wide, split emphasis spans: **376 → 47**, with 342 repaired. The 13 that
appear "new" are bean `3mo4` — `cleanMarkdownText` leaving literal `****` for a
code span wrapped in emphasis — surfacing in one msgid instead of being split
across two. Proven pre-existing: the before-state already emitted
`"**** — fail if entries ≥ ,"`.

### The 10 earlier catalogues were REPLACED, deliberately

They were derived from the superseded extractor: 28 of `ar/accessibility.po`'s 131
msgids no longer existed in the source, being exactly the wrap-split fragments this
fix merges. `--overwrite` was passed as a decision, on the grounds `rmor`'s guard
is there to protect — these were my own unofficial derivations with no human
sign-off, and leaving them would leave stale msgids in every one.

### Two defects found on the way, both pre-existing, both beaned not folded in

- `3mo4` — `cleanMarkdownText` mangles a code span wrapped in emphasis, two
  different wrong ways.
- `rmor` — **`injectMarkdown` deletes every blank line in the document**, not the
  ones it introduced, and that output is WRITTEN to disk by the
  `translation_inject` MCP tool. Measured: 3 blank lines in, 0 out. This is why
  `f6r1`'s round-trip control failed on known-good catalogues. Marked high.


### Why this stays OPEN after #1369 merged

Two Done-when items are genuinely not done, and I closed this bean prematurely
before re-reading them:

- **the 3785 msgids this merges away are not obsoleted** in the existing `.po`
  files. They want doing ONCE, together with `6b8u`'s additions, `ig4a`'s
  removals and `3mo4`'s when it lands — four rewrites of every catalogue would be
  four chances to leave one stale.
- **not checked against a folio other than this one.** Extraction is shared by
  every instance, so a change this size has consequences I have only measured
  here.

The extract half is merged and measured; the corpus-wide bookkeeping is not.
Closing on the first would have hidden the second.

## The cross-folio check is done, and it found a defect

`litlfred/qou` carries no `.po` at all, so "re-derive its catalogues and see
what breaks" was not available. The check became the comparison this bean
actually is: the extractor at `958e36d7840^` (`6b8u` + `ig4a` + `wlyg`, no
hard-wrap merging) against the extractor now, over 150 of qou's markdown files.

| class | count |
|---|---|
| msgids old to new | 17832 to 16022 |
| unchanged | 14416 |
| merges — what this bean intends | 1128, widest 12 old entries |
| differ only by collapsed internal whitespace | 191 |
| differ only by a stripped subscript underscore | 122 → bean `o29r` |
| neither — inline-code gaps, `3mo4` territory | 165 |

**The merging itself held.** 1128 merges over a corpus it was never tuned on,
and not one joined two different constructs. The widest merge spans 12 old
entries, which is a 12-line hard-wrapped paragraph re-joined — exactly the
intent.

**What it found instead is `o29r`**: `MD_ITALIC_UNDER_RE` has no intraword
guard, so two underscores anywhere in one string are read as emphasis and both
deleted. `$a_1$ and $b_2$` becomes `$a1$ and $b2$`; `snake_case_name` becomes
`snakecasename`. This bean does not cause it — the minimal case needs no
merging — but it widens the blast radius, because joining wrapped lines puts
more subscripts into one string, and per-line cleaning happened to protect a
subscript that was alone on its line. On a `paper` folio the corrupted artefact
is a formula.

That is the argument for this Done-when item existing. On this folio's own
corpus the defect is nearly invisible; one repository of mathematical prose
surfaced 122 instances.

## Three harness corrections, recorded because each looked like a finding

1. A wrap-invariance harness reported 95 violations. Its re-wrap put
   `+ JSON-Schema` at the start of a line, which IS a markdown bullet — the
   extractor was right.
2. An over-merge regex reported 86 violations, firing on `proved in  + Lean`, a
   double space left by a stripped code span.
3. Comparing the outputs as SETS reported 3459 dropped msgids. A msgid corpus
   is a MULTISET: `indexOf` consumed only the first `"Package"`, so the second
   copy of a repeated table header read as dropped. Any corpus with tables
   breaks a set-based comparison this way.

None of the three was the extractor. A cross-corpus comparison needs its own
harness checked as carefully as the thing it measures.

## The obsoletion is done, and the count was 41 rather than 3785

The figure in this bean's body predates #1369, which regenerated most catalogues
with `--overwrite`. Re-measured on `main` at `c6960465301`:

| | |
|---|---|
| comparable catalogues | 58 — **6127** live msgids |
| **stale** | **41** |
| where | `ar` 15, `ru` 15, `fr` 11 — all `agent-onboarding.po`, nothing else |

They are exactly what this bean is about: the wrap-split fragments the merge
removed. `"Don't write content into the platform. If it names a chapter, a"` and
`"constant, or a vocabulary, it is folio data."` are two halves of one sentence.

Marked `#~` obsolete by `cat-harness/content/pipeline/obsolete-stale-po.ts`.
**Nothing was deleted, and that is measured** — 84 active msgstr in
`ar/agent-onboarding.po` before, 69 active + 15 newly obsolete + 1 already
obsolete after, and every one of the 84 strings still present in the file.
`translation:block-qa` regenerated: coverage unchanged at ru 69/80, fr 18/80,
because an obsolete entry is not counted as a translation either way.

## The tool asks the FILE what its source is — three earlier attempts guessed

This is the fourth version of the same measurement and the first sound one. The
three before it each invented a pairing rule where the artefact carried a
declaration, and each produced a confident wrong number:

| attempt | rule | what it got wrong |
|---|---|---|
| 1 | `join(DOCS, page + ".md")` | top-level pages only; reported "0 of 14 pages differ" and was used to claim no catalogue was stranded. Three were (`o29r`) |
| 2 | recursive match on BASENAME | paired `kg-viewer.po` with an unrelated same-named page; **200 of its 281 findings were that one mistake** |
| 3 | basename + uniqueness check | sound, but still a guess |
| 4 | the `.po`'s own `#:` references | — |

`kg-viewer.po` declares `scripts/kg-viewer-strings.ts`: TypeScript UI strings this
markdown extractor never touches. Attempt 2 compared them to a markdown page and
called all 40 msgids stale, in five locales.

So the tool reports three states it refuses to fold into a count — **other-sourced**
(5 catalogues, the `kg-viewer` set), **undeclared** (10, `index.po` and
`glossary.po` carry no `#:` at all) and **ambiguous** — because *"no findings over
the subset I could resolve"* is precisely the shape that produced the wrong claim
in row 1.

## What this does NOT fix, and why the better repair was unavailable

Re-deriving those three catalogues would give correct msgids AND correct msgstrs
from the published pages — strictly better than obsoleting half-sentences. It is
blocked: `publishedPairs` scans the site root only, so `guides/agent-onboarding.md`
is invisible to every catalogue tool, which is **bean `9rnf`**. The owner's decision
of 2026-09-27 is to do both in order — this obsoletion now, the re-derive after
`9rnf` — so these 41 obsolete entries are expected to be superseded.

That `9rnf` exists at all is the same blind spot a third time: attempts 1 and 2
above, and the shipped discovery in #1411, all treated "the pages" as the ones
visible without recursing.

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n sweep of in-progress beans whose work has landed). Every Done-when box was already ticked by its holder. That was NOT taken as the evidence: the measurement below was re-run on main at 24b221415 (2026-10-06), and no open PR names this bean.

- `bun run translation:obsolete:check` → exit 0: every comparable catalogue's msgids are still in its source (box 5's tooling and gate).
