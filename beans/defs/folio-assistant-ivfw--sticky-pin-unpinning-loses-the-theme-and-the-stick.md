---
# folio-assistant-ivfw
title: 'STICKY PIN: unpinning loses the theme and the sticky cannot be moved — it should stay visible and movable on the board'
status: todo
type: bug
created_at: 2026-09-20T15:09:58Z
updated_at: 2026-09-20T15:09:58Z
parent: folio-assistant-o3xy
---

Owner, 2026-09-20, verbatim:

> when you unpin, sticky, it loses its theme and you cant move around dispaly.
> treate it as visible to move in fixed place around miro build like folio
> visualtion.

## Two defects in one gesture

1. **Unpinning LOSES THE THEME.** A pinned sticky renders with its backdrop
   art; unpinned it comes back as a flat card. The theme is a property of the
   sticky, not of the pinned state, so losing it on unpin means the pin button
   silently changes what the note IS.
2. **An unpinned sticky cannot be MOVED.** It has nowhere to go and no way to
   go there.

## What it should be instead

> treat it as visible to move in fixed place around miro build

So unpinned is not "hidden" or "returned to a list" — it stays **visible**,
keeps its theme, and becomes **movable**, positioned on the board the way a
note on a Miro board is. The board is the fixed frame; the sticky moves within
it. That is the same model `6lb8` describes for the folio/Miro board, so this
is not a new surface — it is the pin gesture finally agreeing with the board
it sits on.

## Where it is

`mountTodoBoard` in `docs/assets/js/docs-ui.js` (the Pin control is built
around line 1959, `"⇱ Pin"`, with the rationale for it being a BUTTON rather
than a drag at line 2006: *"So the gesture is a BUTTON: Pin lifts the sticky
onto the page, Close ..."*). **Read that comment before changing this** — the
button was a deliberate choice over a drag gesture, and "movable" must not
quietly discard the accessibility reasoning recorded there. Movable in a fixed
frame can still be keyboard-driven; a drag-only affordance would be a
regression this repository has already argued itself out of once.

An inline sticky *already* carries no Pin and no Close (line 1951) because it
sits beside the content it is about — so whatever lands here must keep that
case working, and there is an e2e test pinning it: *"an inline sticky carries
no Pin and no Close"*.

## Depends on

- `6lb8` — the Miro-like board. This is that board's movement model applied to
  a sticky that already exists, so the two must agree rather than ship two
  notions of "position on the board".
- `5y4b` — todo stickies carrying theme art. If a todo sticky has no theme in
  the first place, "loses its theme on unpin" is half-moot; do these together.

## Done when

- [ ] Unpinning preserves the sticky's theme and art
- [ ] An unpinned sticky is visible and movable within the board frame
- [ ] The keyboard path survives — no drag-only affordance
- [ ] The inline-sticky case and its e2e test still hold
