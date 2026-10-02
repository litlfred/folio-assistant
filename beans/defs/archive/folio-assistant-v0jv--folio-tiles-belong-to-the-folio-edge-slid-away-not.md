---
# folio-assistant-v0jv
title: FOLIO TILES belong to the folio edge, slid away — not in the board flow and not only in the sidebar
status: completed
type: bug
priority: normal
created_at: 2026-09-21T17:28:40Z
updated_at: 2026-09-21T20:07:25Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-21: "folios have tiles do not go to the window. they are stacked around (bottom?, again read exsiting docs/siblings/beans) of folio, slid away, open to tiles to things like fsh-gts, todos, docs, etc."

CORPUS CHECK. harness-tiles already states the rule this refines: 'Tiles render in the navbar AND on the board: one declaration, per-surface visibility, never two registries.' So the declaration side is right and must not be rebuilt. What is wrong is the board-side PLACEMENT: '.fa-board-tiles' (docs-ui.css:3762) is a flex-wrap row appended after the sticky grid, in flow. It is neither stacked at an edge nor slid away, and on the landing page it lands below every full-bleed card.

Also confirms the tiles must NOT be projected onto the glass — they are folio chrome, where a window is content.


## Built 2026-09-21 — placement only, and that was the whole point

The bean's own corpus check was right and is the reason this change is small:
`harness-tiles` already fixes the declaration side — *"declared once,
per-surface visibility, never two registries free to disagree about what a tile
is"* — and `mountGraphTiles("board", …)` already filtered the same array the
navbar reads. **Only the placement was wrong**, so nothing in the registry,
`readerShownTiles`, or the visualiser declaration was touched.

### What changed

`.fa-board-tiles` was `display: flex; flex-wrap: wrap` appended after the
sticky grid, **in flow** — on the landing board that put it below every
full-bleed card, which is why the declared visualisations read as absent. It is
now the body of a `<details>` docked at the board's bottom edge.

**`position: sticky`, never `fixed`, and the difference is the design.** The
dock belongs to the FOLIO: it travels with the board and disappears when the
board does. A viewport-fixed bar would be chrome for the *page* — a different
object — and would follow a reader onto content that has no tiles at all.

**Not on the glass**, which this bean states outright: *"the tiles must NOT be
projected onto the glass — they are folio chrome, where a window is content."*
So the dock's `z-index` sits **below** `.fa-sticky-layer`'s, and an open window
passes over its own frame. Same arrow as `board-diagram-interchange`: chrome
frames content, never the reverse.

A `<details>` for the reason the sticky drawer is one — the disclosure, the
keyboard path, Escape and the expanded state are the browser's, and it degrades
to everything-visible with no JavaScript, which is R4's floor rather than a
convenience.

### Falsified

Held the change out: **four of five dock specs fail** — `.fa-board-dock` does
not exist. The fifth, *"the dock holds the BOARD surface's tiles"*, **passed
pre-change**, and correctly so: the tiles were already the right SET, just in
the wrong PLACE. That assertion exists to stop a placement change becoming a
registry change, which is a property that was already true and had to stay
true. Two assertions because they are two properties — the same shape as
`23bc`'s coupling case.

116 e2e across graph-tiles, sticky-todos, a11y and board-windows; gates 93/93.

### Done when

- [x] the tiles are docked at the folio's bottom edge, slid away by default
- [x] the dock is the BOARD's edge (`sticky`), not the viewport's (`fixed`)
- [x] it opens and closes from the keyboard alone, with an accessible name that
      says what is inside rather than what shape it is
- [x] opening it does not move the board's own content — measured, not inferred
      from `position: sticky`
- [x] an open window passes OVER it: chrome is not content
- [x] an EMPTY dock does not render — a row that opens on nothing is `pb04`'s
      failure again
- [x] the registry is untouched, and a spec holds that line

### Not done

The *three rows of board furniture* `qefk`'s title also named: the filter row
and the board head are `z1ug`'s subject, and collapsing them from inside this
bean would decide that layout for it.

## SUPERSEDED IN PLACEMENT, 2026-09-21 — see `folio-assistant-j2if`

**What this bean built is not what shipped, and the difference is the edge and
the default.** R23 puts the tiles along the board's **TOP**, **open**. This
bean built them at the bottom, closed, on the same branch and before it merged.

**This bean's own text is why that was available rather than a contradiction.**
It quotes the owner as *"stacked around (bottom?) of folio"* — the parenthesis
and the question mark are the requester's and were carried in verbatim because
they marked an open question, not a decision. Keeping them is what let the
reversal be read as settling a question instead of overturning an agreement.

Everything else here stands and was not rebuilt: `sticky` rather than `fixed`,
chrome passing under an open window, the empty-strip rule, and above all the
registry — the placement change never became a declaration change, which is
what the first spec exists to hold.

**Two consequences for a reader of the checklist above.** *"docked at the
folio's bottom edge, slid away by default"* is now false of the code and is
left rather than edited, because an edited checklist cannot be told from one
that was right the first time. And *"opening it does not move the board's own
content"* — that spec was **deleted**, not repaired: it asserted no reflow,
which is right for a bottom dock and wrong for a top strip, since *"whole
slides up"* means the content moves. A spec that keeps passing against a
changed requirement is worse than no spec.
