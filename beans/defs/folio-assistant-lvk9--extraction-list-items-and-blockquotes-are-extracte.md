---
# folio-assistant-lvk9
title: 'EXTRACTION: list items and blockquotes are extracted PER LINE, so a msgid depends on the author''s hard wrap — translators get sentences in halves'
status: todo
type: bug
created_at: 2026-09-26T09:20:19Z
updated_at: 2026-09-26T09:20:19Z
parent: folio-assistant-bzyu
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

- [ ] a list item is one entry however it is wrapped, with continuation lines
      recognised by indentation, ending at a blank line or the next marker
- [ ] a blockquote is one entry per blockquote, not per line
- [ ] MEASURED AFTER: no msgid is a clause fragment — specifically, no pair of
      adjacent msgids where the first opens a `**` span the second closes
- [ ] MEASURED AFTER: re-wrapping a source paragraph, list item or blockquote
      changes NO msgid — the property that makes a catalogue survive an edit
- [ ] the 3785 msgids this merges away are obsoleted in the existing `.po` files
      with tooling, not dropped
- [ ] `7x8o` re-measured afterwards; expect 8 pairs or fewer to remain
- [ ] checked against a folio other than this one — extraction is shared
