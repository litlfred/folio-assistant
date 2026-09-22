---
# folio-assistant-j2if
title: 'FOLIO VISUALISATION (R18-R32): square strip on top, condensed cornerless geometry, and an asset''s THREE states'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-21T21:40:00Z
updated_at: 2026-09-22T08:55:33Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-21, in one message plus three follow-ups. The verbatim text and
the full R18-R32 table are in the design record
(`cat-harness/docs/architecture/folio-board-requirements.md`, "Round three");
this bean carries only what is to be built and what would falsify it.

## Why this is a round and not an amendment

Two of these requirements **reverse work that had not yet merged**. `v0jv`
built the tile dock at the board's BOTTOM, CLOSED, and R23 settles both halves
the other way: TOP, and OPEN. `v0jv`'s own text is why the reversal was
available rather than a contradiction — it quoted the owner as *"stacked around
(bottom?) of folio"*, and the parenthesis and question mark are the requester's,
carried into the bean verbatim because they marked an open question. Folding
these into R1-R17 would lose the fact that a branch-shipped design was turned
round before any reader saw it.

## What is built here

- **R18/R22** condensed, cornerless geometry. `--fa-folio-radius` is ONE token
  on `:root` that thirteen folio surfaces ask for, rather than thirteen
  `border-radius: 0` edits with no name. Pills (`.fa-sticky-chip`,
  `.fa-sticky-badge`, `.fa-tile-count`) do NOT opt in and that is written
  down: the stated cost is dead space and a pill has none.
- **R19/R23** the tiles are a SQUARE strip along the board's top, open by
  default, `position: sticky`, chrome rather than a sub-panel.
- **R31** `condense()` strips whitespace, newlines, bullets, list markers and
  heading hashes from the sticky's OWN text. No second string.
- **R32** `--fa-sticky-max-width: 20rem`, and the `1fr` track that made the
  card's width a function of the viewport is gone.

## Falsified

**`1fr` was the bug, and no spec caught it.** The grid was
`minmax(17rem, 1fr)`, so every column absorbed the leftover width and a card's
size was whatever the viewport left — a number nobody chose. A width assertion
written against that grid passes or fails on the test viewport alone, which is
why `the cards do not stretch to fill the row` exists beside the width spec
rather than being folded into it.

**`aspect-ratio` does not make a square.** The first tile rule used
`aspect-ratio: 1 / 1` and measured **64 x 68.8px**: `.fa-board-tiles` is a flex
container whose default `align-items: stretch` grows every tile on a line to
the tallest, and a two-line caption is enough. Fixed `height`, reduced padding
so the caption does not wrap, `align-items: flex-start`, and the box measured
rather than the declaration read.

**A CSS inch is not an inch.** `in` is defined as exactly 96 CSS px. The 16"
MacBook Pro named in R32 presents 1728 CSS px across ~13.6" of glass — ~127 CSS
px per physical inch — so `2.5in` would have rendered ~1.9" and looked like the
requirement was ignored. 20rem (320px) is ~2.5".

**One `v0jv` spec was DELETED rather than repaired**, and deliberately:
*"opening it does not move the board's own content"* asserted no reflow, which
was right for a bottom dock and is wrong for a top strip. *"Whole slides up"*
means the board's content moves. A spec kept passing against a changed
requirement is worse than no spec.

## Done when

- [x] the tiles are a square strip along the board's TOP, open by default
- [x] the strip is `sticky` (the board's edge), passes under an open window,
      and does not render when empty
- [x] the folio visualisation has no rounded corners, through one token
- [x] board and landing gaps and the board's own padding are condensed
- [x] a closed sticky shows its own text, condensed; no second string
- [x] a sticky is ~2.5 physical inches on the named screen, and does not
      stretch with the viewport
- [x] R18-R32 recorded in the design record with provenance kept
- [x] `board-windows` carries the three-state rule and the folio-belongs-to-
      the-harness rule; `harness-tiles` carries the strip and square rules
- [x] **R30's three states are BUILT** — the glass's half and the
      library's half; see "Stage 2" below
- [ ] **R24-R29 are RECORDED, NOT BUILT** — see below

## Not done, and why

**R24-R29 are declarations this repository cannot make yet.** `folio/` is
deliberately absent from `cat-harness.json` — this repo is pre-split (#223) and
the declaration comment states the rule outright: a directory declared but
absent is worse than one missing, because every consumer then scans nothing and
reports a clean run over it. So `folio/` as the reader's content directory
(R26), materialised assets living in it (R27), created-or-linked documents
(R28) and cross-library references (R29) are recorded as requirements and wait
on the split. Declaring them now would be the `dh4f` defect on purpose.

**R30's glass is specified, not implemented.** The three-state rule is in
`board-windows` because it governs what `close` may do, and the current close
is a board gesture over a board that is not yet a pull-down glass. Implementing
the glass without the library half would ship exactly the two-state model the
rule exists to forbid.

**R19's second clause has no rule.** *"OR use theme/avatars as appropriate"* —
when is a thing a tile and when is it an avatar? Nothing states how to choose,
and a rule invented to close the gap would read like one that was agreed.
Open on #796.

## Stage 2 (R30): the three states, built

The glass from `funp` held only what a page floated into it. This is the half
that makes it the reader's folio.

| state | representation | reached by |
|---|---|---|
| in the library | **no entry at all** | the default |
| in the folio, not displayed | entry with `shown: false` | the reader closed it on the glass |
| on the glass | entry with `shown: true` | the reader pulled it out FROM A LIBRARY ROW |

**The rule is structural rather than remembered.** The store is an object
keyed by `<instance>/<id>`, not an array of ids like `fa:todos-discarded`.
With an array, *"closed"* and *"never pulled out"* are the same absence and
the middle state cannot be represented at all — so the data shape enforces
`board-windows`'s rule instead of the call sites honouring it.
`shelveFromGlass` sets a flag and never deletes; there is deliberately no
`forget` function beside it, because a function with that name next to that
one gets called by mistake.

**The asymmetry is the feature.** `displayInFolio` is called only by a
library row; `shelveFromGlass` only by the glass. *"Putting it back on the
glass is a separate act performed from the library — not from the glass it
just left."* The row offers no close while an asset is on the glass, so
"where does this go" is answered once.

Per-viewer `localStorage`, and **the UI says so in words** — the
discarded-todos rule unchanged, for its stated reason.

## Falsified

**Five specs exist to fail a two-state build**, which would pass every
happy-path test in the file: closing leaves it the reader's; the way back is
on the library and NOT on the glass; the glass says where the way back is; a
shelved asset survives a reload AS SHELVED rather than as forgotten; putting
it back returns it.

**And one spec failed, for a real reason.** With the glass open the sheet
covers the library row — Playwright named it as intercepting the pointer. The
shelved-note had said *"open its library view to put it back"*, sending the
reader to a control its own surface was covering. That is `pb04`: the
affordance exists, it is reachable, and not from where the reader is
standing. The note now says **"Put your folio away, then open the library
view"**, and a spec pins that the glass really does intercept — otherwise the
note would be telling readers to do a needless step with nothing saying so.

14 of 14 specs in `test/folio-three-states.e2e.ts`.

## Still not built

The library GENERATORS do not yet emit `data-fa-library-item` rows, and
`cat-harness` has not opted its library view into `folioMount`. So the
mechanism is complete and reaches a real page only through a fixture. That is
the next increment and it is deliberately separate: wiring a generator is a
different change from establishing the state model, and shipping them
together would have made the three-state specs hostage to a generator's
markup.
