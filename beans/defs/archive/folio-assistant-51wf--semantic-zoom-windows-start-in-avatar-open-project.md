---
# folio-assistant-51wf
title: 'SEMANTIC ZOOM + WINDOWS: start in avatar, open projects a window, z-order with raise-on-select'
status: completed
type: task
priority: high
created_at: 2026-09-20T21:46:31Z
updated_at: 2026-09-21T12:10:01Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R2 + R9 + R15. Unit 4 of 10.

**Two mechanisms that must not be conflated**, which is the whole finding here:

| | trigger | who |
|---|---|---|
| **semantic zoom** | the card's RENDERED width crosses a declared threshold | automatic |
| **open / close** | `[x]`, or opening a card | a person |

`schemas/semantic-zoom.ts` declares the first (folio default, per-kind override,
`because` required on every override, and `zoomThresholdFor` returns the SOURCE so
an inherited number stays traceable). The second is new.

**The owner's ruling, 2026-09-20:** *"start everything in avatar"*, `[x]` closes to
the avatar, and — on which mechanism wins —

> open is like window, avatar/tiles project open panels onto window. sum
> functionality, need to handle z-order.. selecting any part raises

So an open card is a **window**, not a zoom state: it is projected ON TO the board
rather than being the card grown large. An explicit open therefore survives zooming
out, and the board needs a stacking order with **raise-on-select**.

**One question left open, with a stated default:** is z-order PERSISTED in the DI
layer or session-only? `board-positions.ts` deliberately carries no `z` — *"stacking
order is a rendering decision the board makes from the document"*. Default taken:
**session-only**, derived from the raise sequence, because a committed z per note
would make every raise a file write and every two sessions a conflict. Cheap to
reverse: it is one optional field in the DI document.

## Done when

- [x] every card starts CLOSED, and a closed card is its avatar below the
  declared threshold and its words above it — the avatar is present at every
  width as the control that opens the window
- [x] opening projects a window; `[x]` closes back to the avatar
- [x] an open window survives a zoom-out past the threshold
- [x] selecting any part of a window raises it
- [x] zoom falsified in BOTH directions — a test that only checks the shrunk case passes for a board that is always avatars
- [x] a kind with no avatar takes `GENERIC` rather than rendering blank

## Summary of Changes

**The declaration had no home and no reader.** `schemas/semantic-zoom.ts` existed
and nothing read it: no document, no writer, no consumer. So R2 — *"the threshold
SHALL be declared data, not a literal in the renderer"* — was satisfied on paper
by a module nothing could reach. Fixed at three points:

- `readSemanticZoom(root)` reads the folio's `semantic-zoom.json` from **the root
  of the instance that owns the folio**, beside its `harness.json`. Not the
  instantiation root: `<name>.config.json` says an instance is instantiated HERE,
  which is a different question from what one of them declares about its content.
  A board cannot own it either — the threshold survives deleting every board, and
  `board-diagram-interchange`'s test says a fact that survives the layout is not
  layout.
- `gen-docs-pages.ts` publishes it to `assets/semantic-zoom.json`, and publishes
  **nothing** when the folio has not declared one. `docs-ui.js` then gets a 404,
  says so once, and leaves every card's words in place. A default in either file
  would be the literal R2 forbids, one layer further from where anybody looks.
- This folio declares one: 220px default, with a `todo` override at 300px citing
  why.

**`schemas/window-stack.ts` is the open/close model**, session-only and holding no
schema, no `$schema` tag and no file — it is state, not a document. An ARRAY
rather than a map of z-numbers, because the array IS the order: a
`Record<id, number>` can hold two cards at one z, a gap, or a z for a card that is
not open, and every consumer would have to defend against all three.

**The two mechanisms are separate by construction, not by a flag.** The zoom path
takes no window state and the window path takes no width, so "an open window
survives a zoom-out" needs no special case. `window-stack.test.ts` asserts that on
the SIGNATURE — `rendersAvatar.length === 3` — so a future edit that made zoom ask
"…unless it is open" would fail rather than pass quietly.

## Two things worth the next agent's attention

**A drift risk, named rather than hoped away.** `docs-ui.js` is a browser script
and cannot import `window-stack.ts`, so there are two implementations of one rule.
`test/board-windows.e2e.ts` mirrors `window-stack.test.ts` case for case against
the real file, so a drift fails one of the two.

**A real limit, not hidden.** Windows cannot be moved or resized yet — that is
`le8b` — so a deep stack does cover the grid beneath it. The cascade's vertical
step is deliberately larger than the title bar so a covered window's bar stays
selectable (selecting any part raises it, which makes its own `[x]` reachable),
and the keyboard path is unaffected because focus does not care what is painted
on top.

**One open call, taken by the stated default.** Z-order is SESSION-ONLY, derived
from the raise sequence, not persisted in the DI layer: raising is the most
frequent gesture on a board, so a committed `z` would make every selection a file
write and every two concurrent readers a merge conflict, to record something
neither of them chose. Cheap to reverse — one optional field in the DI document
and a serialiser on a module whose shape is already a plain array of ids.

## A question the Done-when could not settle

*"every card starts as its avatar, at any size"* and R2 *"as the board shrinks, a
card SHALL stop rendering its words"* cannot both be literal: if cards are avatars
at every width, R2 is vacuous. Read as **"starts closed"**, which is the reading
that leaves R2 with work to do, and built accordingly: a closed card shows its
words above the threshold and its avatar below it, and the avatar is present at
every width as the control that opens the window. Flagged rather than silently
chosen.

`bun run gates --all` — 88/88, 234 e2e.


## The wording is settled, 2026-09-21 — owner's ruling

The section above recorded a conflict this bean could not settle: *"every card
starts as its avatar, at any size"* against R2, *"as the board shrinks, a card
SHALL stop rendering its words"*. Both cannot be literal — if cards are avatars
at every width, R2 is vacuous.

**Asked as a selection, 2026-09-21. The owner confirmed "starts closed"**, which
is what was built and what leaves R2 with work to do. The first Done-when above
is reworded to say that, so the checklist no longer carries a sentence the
implementation contradicts.

Nothing in the code changes. What changes is that the next agent reading this
bean finds one statement instead of two, and does not re-derive the conflict.
