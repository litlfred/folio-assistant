---
# folio-assistant-le8b
title: 'BOARD FILTER + MOVEMENT: a reader''s filter that commits nothing, and keyboard-first move/resize'
status: completed
type: task
priority: normal
created_at: 2026-09-20T21:46:57Z
updated_at: 2026-09-21T14:36:14Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R13 + R14. Unit 8 of 10.

**Two filters, and they must not become one field.** CRDM Q3 gave the board a
DECLARED filter (`schemas/board.ts`: `pages`, `kinds`; OR within an axis, AND
across them; absent means the whole folio). The owner's later *"be able to filter
out by kind properties things on miror board"* is the READER's filter, applied at
view time and belonging to nobody's document.

Conflating them would make a reader's temporary view edit the board everyone else
opens.

**Movement** — *"can resize open content, move around. drag and drop moving.."* —
rides R4's floor. Drag is an ACCELERATOR. Every move must also be keyboard
operable, which is why the existing Pin control is a button: the declared
interaction profile here is low-dexterity, and a board whose only affordance is
drag excludes its own owner.

A move writes the DI layer (`place`/`unplace`), never the note.

## Done when

- [x] a view-time filter by kind and by kind properties, affecting nothing committed
- [x] the declared board filter and the reader's filter stay separate, asserted
- [x] resize and move, both keyboard-operable, drag as an accelerator
- [x] a move writes `board-positions.json` and touches no note — at the MODEL, `moveBy`.
      The page moves windows in session state; see "Where a move becomes durable".

## Summary of Changes

**`schemas/reader-filter.ts` is the second filter, and it holds no `$schema`, no
file name and no writer** — state, not a document, like `window-stack.ts`. Same
logic as the board's declared filter on purpose (OR within an axis, AND across),
because a reader who has learned one has learned the other, and two logics on one
surface is a thing nobody can predict the result of.

Three properties the tests pin rather than the prose claiming them:

- **The reader's filter can only NARROW.** `visibleOn` composes `boardContent`
  first, and the subset property is asserted over every filter the fixture can
  express rather than over the one composition that happens to be written. A
  board scoped to one page stays scoped to one page however its reader filters.
- **It commits nothing**, asserted against BOTH documents a "filter" could
  plausibly reach: the board's own declaration and `board-positions.json`, each
  byte-identical after filtering. In the browser: `localStorage` unchanged, and a
  reload starts unfiltered.
- **An EMPTY axis is refused**, not read as "match nothing". `kinds: []` reads one
  way to a naive implementation and the other to a careless one, and neither is
  what a reader who just cleared every checkbox meant.

**Movement is keyboard-first, and the file says so before it says anything about
drag.** The `move` control enters a MODE — because arrow keys already scroll, and
a window that moved whenever a reader pressed one while reading would have stolen
the page's own navigation. The mode is ANNOUNCED through a live region rather than
only outlined. Arrows move, `Shift`+arrows resize, `Escape` or `Enter` leaves, and
leaving is not an undo. Two floors are enforced: a window cannot be resized below
`160px` or moved past the origin, both for the same reason — a window whose `[x]`
a reader cannot reach is `l4zi` by another route.

Drag is added OVER that rather than instead of it, and a drag that starts on a
control is deliberately not a drag, or it would fight the click that closes the
window.

## Where a move becomes durable

`moveBy(doc, board, note, dx, dy)` in `board-positions.ts`: a DELTA rather than an
absolute, so no caller outside that module composes coordinates; `undefined` for a
note that is not placed, because "move it from where it is" has no answer for a
note that is nowhere and answering anyway would put it somewhere nobody chose. It
touches the LAYER and nothing else — structurally, since that module imports
nothing from the content graph and has no note to reach.

The page moves windows in session state. Same reason as `db7g`, settled by the
owner the same day: a published page cannot write the repository, and it is better
to be a control over this reader's view and say so than to look like it changed
the folio.

## Two real defects the tests found

**A geometry round-trip that was not idempotent.** The move code reads geometry
from `getBoundingClientRect()` — the border box — and writes it back as
`width`/`height`, which under the default `content-box` are not the same number.
Every first nudge silently grew the window by its border, 450 → 452. Caught by the
four-directions spec asserting that four opposite nudges return to the start.

**A bar that is now mostly controls.** The drag test grabbed the title bar's centre
and did not drag, because the centre is a control and a drag starting on one is
correctly refused. The fix was in the test — grab the TITLE, which is what a person
reaches for — but the finding is about the UI: the bar carries seven controls now.

`bun run gates --all` — 92/92, 312 e2e.
