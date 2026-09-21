---
# folio-assistant-z1ug
title: 'STICKY PANEL: the landing stickies and the todos share one panel, minimised to a tile at start'
status: in-progress
type: bug
priority: high
created_at: 2026-09-21T17:11:37Z
updated_at: 2026-09-21T18:46:42Z
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

- [ ] the stickies being IN the panel as items you pin OUT of it, rather than
      page content that happens to sit inside a disclosure (needs pv6g's home
      panel field)
- [ ] tiled/avatar presentation inside the panel rather than full cards
- [ ] the control weight, which is qefk
