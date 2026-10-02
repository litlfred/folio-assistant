---
# folio-assistant-z1ug
title: 'STICKY PANEL: the landing stickies and the todos share one panel, minimised to a tile at start'
status: completed
type: bug
priority: high
created_at: 2026-09-21T17:11:37Z
updated_at: 2026-09-23T13:44:01Z
parent: folio-assistant-6lb8
---

Tracked as https://github.com/litlfred/folio-assistant/issues/756 items 1, 2 and 4.

Owner, 2026-09-21: "i dont want fa-sticky-board fa-landing-board to have inside it: fa-sticky fa-landing-sticky ... i want them in the sticky panel instead", "i thought the sticky panel had some todos, but they seem gone. they should be closed/tiled to start", "the todo panel should start minimized with an icon to open".

landing.html:74 renders the harness stickies as direct children of .fa-landing-board; mountTodoBoard (docs-ui.js:2775) appends its own board AFTER them, so the todos render past the end of a row of full-bleed cards and read as absent.



## Landed 2026-09-21 — the panel is slid away

Owner, escalating mid-session: "please!!! i dont want to see these giant cats
at the top anymore. priority #1 make the stikypanel slid away"

`_includes/landing.html` now wraps the board in a `<details class="fa-sticky-panel">`
with NO `open` attribute, so the landing page opens with a single 2.75rem bar
instead of a screen and a half of cat. `mountTodoBoard` already mounts into
`.fa-landing-board`, which is now inside that panel — so the harness stickies
and the todos ARE in one panel, which is the first half of this bean.

`<details>` rather than a script, for the reason nav_footer_custom.html gives
for the harness tabs: keyboard-operable, announces its own state, and works
with no JavaScript. A JS disclosure would have put the stickies behind a fetch,
which is the jtj floor violation measured on 2026-09-21.

Spec-conformant rather than improvised: issue #764 section 5 S6 is the owner's
own "if not placed on a document somewhere, they in slide down panel at top
with [stikcy] icon to open or so", and a docs page is a webpage, not a folio.

Verified by RENDERING the include through Liquid against the real _data (a full
Jekyll build is not possible here — the remote theme download is 403 through
the egress proxy). The render emits `<details class="fa-sticky-panel">` with no
`open`, count 3, all three cards inside `.fa-sticky-panel__body`. 93 gates pass.

### Still open on this bean

- [x] the stickies being IN the panel as items you pin OUT of it, rather than
      page content that happens to sit inside a disclosure (needs pv6g's home
      panel field) — DONE by `pv6g` (#1030): Pin to glass, a Return in the slot
- [x] tiled/avatar presentation inside the panel rather than full cards
- [x] the control weight, which is qefk — `qefk` is completed

## Owner ruling and build, 2026-09-23 — tiles that open as windows

Asked what pressing a tile should do (open as a window / expand in place / pin straight to the glass), the owner chose **"Opens as a window"**:

> Same as the todo avatars next to it: the full card opens as a movable window with × to close. 'Pin to glass' stays on the tile.

- **Tiles.** Each landing cell gains a tile: the card's own art (`currentSrc`, so the crop the browser chose) with its title, wearing the sticky's theme. The card stays in its slot, hidden by the tile class and not removed, because it is the sticky's HOME and Pin clones it. No script means full cards, which is R4's floor.
- **One window mechanism.** The window is the board's: the same `.fa-board-window` chrome and frame controls, the same stack (`openWindowFor`/`zIndexFor`, keyed `landing:<slot>`), the same cascade and `wireMove`. The window has Move, Pin to glass (which closes the window and pins) and ×. Escape closes it, and focus returns to the tile.
- **Found by a spec, then fixed.** The first version hung trying to click the second tile. The windows opened OVER the tile row (the board's layer is `inset: 0`), so one open window buried every other tile. In a panel of five tiles that makes the panel unusable, so the landing window layer is anchored to the board's BOTTOM edge and windows hang beneath the tiles. A spec asserts the other tiles stay hit-testable.
- **Found by a screenshot, then fixed.** The first tile drew pale words on a pale surface: it took the card's surface but inherited the page's ink. Tiles and windows now take the sticky's theme, surface and ink together.

## Summary of Changes

All three open items are done: two by earlier beans (`pv6g`, `qefk`) and the tiles here. `sticky-home.e2e.ts` has 7 new specs (tile, window, ×/focus, Escape, stacking, tiles not covered, Pin from the window), and three earlier specs are updated for a home that is now drawn as a tile. Full e2e 589/589, gates 135/135.
