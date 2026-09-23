---
# folio-assistant-c132
title: 'GLASS ON PHONE AND TABLET: a phone gets one linear column, a tablet gets the laptop surface with touch drag'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T09:19:39Z
updated_at: 2026-09-23T09:54:09Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-23, after #1030 merged:

> Doesn't appear on mobile obviously. Mobile phone is maybe linearized view due to space. But tablet should be like laptops

## Measured before building

Screenshots of the real `docs-ui.css`/`docs-ui.js` at 390x844 (phone) and 820x1180 (tablet); the live site is not reachable from the build container.

- **Phone:** the laptop metaphor runs unchanged and does not fit. A pinned sticky is 352x220 at the bottom-right, covering a third of the page and sitting over the tile strip, and it stays over the page while the glass is closed. Glass cards are laid out on a free-positioning grid meant for a wide screen.
- **Tablet:** the layout is already the laptop one. But `wireMove` listens for `mousedown`/`mousemove`/`mouseup` only, so on a touch tablet **a finger cannot drag a card**. "Like laptops" is false for the one gesture that makes it a surface.

## Done when

- [x] phone (below 600px): the open glass is ONE COLUMN, in reading order — shelf cards, then pinned stickies — each full width, with no free positioning
- [x] phone: move and resize controls are hidden (a position means nothing in a column); close/return stay
- [x] phone: with the glass closed, pinned stickies do not cover the page; the handle shows how many are waiting
- [x] tablet and up: unchanged layout, and drag works with a finger (pointer events); on a touch screen, drag starts from the card's grip or in move mode, so scrolling a card's text still works
- [x] e2e at phone and tablet sizes

## Built 2026-09-23

- **Phone, below 37.5rem (600px):** every portrait phone is under this line and every tablet, including an iPad mini held upright (744px), is over it.
  - The open glass is one scrolling column in reading order: shelf cards, then pinned stickies, each full width.
  - The laptop geometry is inline, so `!important` is what outranks it. The reader's SAVED place is left untouched in the store, and a spec asserts this: the same reader on a laptop finds their cards where they put them.
  - Move and resize are hidden; Close and Return stay.
  - With the glass closed, nothing floats over the page. The handle prints `· N` from a data attribute, so its text and accessible name are unchanged on every other screen.
- **Tablet:** the laptop surface, unchanged. `wireMove` now uses POINTER events, so a finger drags. A non-mouse pointer drags only from a declared grip (`[data-fa-grip]`: the glass card's face, a sticky's head, an away card's title) or in move mode. Those elements get `touch-action: none`, and everywhere else a finger scrolls.

### Verified

- `glass-devices.e2e.ts`: 9 specs at 390x844 and 820x1180. Mutating the touch path out fails the finger-drag spec.
- Full e2e 525/525. `gates` 131/131.

### A regression the suite caught

`board-windows.e2e.ts` failed twice on the first pointer-events version: "selecting any part raises it". `preventDefault()` on `pointerdown` suppresses the compatibility `mousedown`, and the board windows RAISE on `mousedown`. For a mouse, the handler now leaves `pointerdown` alone and stops text selection on `mousedown`, as before; only a touch drag is prevented at `pointerdown`.

## Not done

- The `· N` count is visual only. A screen-reader user on a phone hears "Pull down your folio" without the number. The accessible name was left unchanged so it stays one name on every screen. Worth a follow-up if the owner wants the count spoken.

## Summary of Changes

Merged in #1039 (issue #1031):
- Phone: the glass is one linear column, and the handle shows "Folio · N".
- Tablet: the laptop surface, with pointer-event touch drag from a grip or in move mode.
- The board-window raise regression was caught and fixed before merge.
- Still open: the "· N" count isn't spoken by screen readers.
