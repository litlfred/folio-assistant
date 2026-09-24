---
# folio-assistant-rx6k
title: 'SEARCH HOME: back in the top display navbar, slidable to the upper-right corner as an icon'
status: completed
type: feature
priority: high
created_at: 2026-09-21T19:49:34Z
updated_at: 2026-09-21T19:49:34Z
parent: folio-assistant-o3xy
---

Owner, 2026-09-21: "also i want the search restored back to the top display navbar, with option to slide out to the UR corner as an icon."

## Summary of Changes

REVERSES the 2026-09-19 decision recorded in docs-ui.js, where search was adopted OUT of the main panel into a Settings tile on the owner's earlier "keep main display panel uncluttered", and where a comment refused a header magnifier outright citing an answer of 'search is two'.

Both the block comment and the tile comment are REWRITTEN rather than deleted, quoting what they used to say. An agent finding a comment that forbids what the code plainly does concludes the CODE is the mistake and reverts working behaviour to satisfy a dead instruction.

- search mounts in .main-header inside .fa-search-home, visible on load
- a slide control moves it to a fixed upper-right card, collapsed behind its own magnifier; the icon is the way back (l4zi)
- the choice persists in localStorage, so it is a setting and not a gesture
- the Search TILE now REVEALS the field where it lives rather than dragging it into the sidebar: one search box, one home, two ways in
- the node never leaves the document — sliding is a class change, because just-the-docs finds its input by getElementById

## Two real defects the tests caught, both mine

1. CONTRAST. The first version gave .fa-search-home a per-scheme foreground the way .fa-tiles has one; axe measured #e6e9ee on #ffffff at 1.21:1. The lesson is worth keeping: .fa-tiles paints its own opaque panel so it MUST name a matching colour, while the navbar search paints nothing and sits in page content — so any colour it names is a guess about a surface it does not own, wrong in one scheme by construction. It inherits now. The border cannot inherit, so it takes #737d8c, which clears 3:1 on white (4.17), dark (3.60) and the light sidebar (3.86).
2. TARGET SIZE. The theme's input is 21px unstyled and the tiles panel had been giving it a height the navbar did not — under the 24px SC 2.5.8 floor, on an instance whose declared profile is low-dexterity. Restored to the 2.25rem it had in the panel, so it is not quietly smaller in its new home.

Also: .fa-qr-toggle stopped being an IDENTITY and became a shared box class the moment the header gained mini-icons, so 39 test clicks through it hit a strict-mode violation. Retargeted to .fa-tiles-toggle.

Verified: bun run gates (93), full playwright suite (336 passed).
