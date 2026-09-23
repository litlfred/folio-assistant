---
# folio-assistant-tcq2
title: 'SEARCH: capped at 44% of the panel, glyph hidden while open, and gone entirely below the theme''s nav breakpoint'
status: completed
type: bug
priority: high
created_at: 2026-09-23T18:41:47Z
updated_at: 2026-09-23T18:52:10Z
parent: folio-assistant-p5wm
---


Owner, 2026-09-23: *"search box takes way too many clicks to get to. it should
start open full top of display panel and then hide away. maginfyingglass
avatar/braadning should be visibile always."*

This revises their own earlier ruling — *"move the search to a icon in navbar
that expands.... keep main display panel uncluttered"* — rather than
contradicting it: the field still collapses, and the collapse is still
remembered. What changes is that it starts open, fills the panel, and leaves a
fixed mark behind.

## Ruling recorded

Asked what should make it hide, the owner chose **never auto-hides**: it stays
open until the reader collapses it with the chevron, and that choice is
remembered. So no timer, no scroll trigger, no blur trigger.

## Three defects, measured before and after

`preview:site` build, Playwright at three widths, `index.html`:

| width | before | after |
|---|---|---|
| 1280 | input **536 / 1224** (44 %), glyph `display:none` | **1091 / 1224** (89 %), glyph visible |
| 900 | 536 / 844 (64 %) | **711 / 844** (84 %) |
| 700 | field, chevron **and glyph all 0x0** | input **583**, glyph and chevron both live |

### 1. Not full width — and every declaration above it was already right

`.fa-search-home[data-place="navbar"]` is `width: 100%` and the holder is
`flex: 1 1 auto`. Walking the box chain up from the input at 1280px:
`.fa-search-home` 1224, `.fa-search-holder` 1190, `.search` 1190, and then the
theme's own **`.search-input-wrap` at 536px with `max-width: 536px`** — sized
for the header just-the-docs renders search in, not for a panel this wide.

The remaining 133px after the fix is the glyph (28), the chevron (28) and their
gaps. The field fills what is left beside its own controls, which is what "full"
can mean here.

### 2. The glyph was hidden in exactly the state the owner looks at

`.fa-search-home[data-place="navbar"] .fa-search-peek { display: none }`, on the
reasoning that the field is present so the control revealing it is redundant.
True of it AS A REVEAL, and beside the point: the ask is for a fixed mark saying
"search is here", in the same place in both states, so the eye has one target.

It keeps a real job rather than becoming decoration — clicking it focuses the
field, which `revealSearch()` already did. A visible glyph that did nothing
would be `gjli`. Its label changes with the state ("Open search" in the corner,
"Search this site" in the navbar): one label for both would be wrong in one of
them.

### 3. Below the theme's nav breakpoint, search left the panel entirely

`.main-header` computes to `display: none` at 700px, and the search home was
inserted into it. So the field, the chevron **and the glyph that is the only way
back** were all 0x0 — search was not awkward to reach on a narrow screen, it was
unreachable from the display panel at all. That is the owner's complaint at its
worst, and it is the part a wider field would not have fixed.

Homed in `.main-content-wrap` instead, which the theme never hides.
`.main-header` stays in the fallback list: a theme that renamed the wrap may
still have the header, and search in the wrong place beats search nowhere.

## Done when

- [x] The field fills the display panel's width beside its controls
- [x] The glyph is visible in BOTH states and does something in each
- [x] Its label says which of the two things it does
- [x] Search is reachable below the theme's nav breakpoint
- [x] The collapse is still remembered across a reload
- [x] Measured at three widths, before and after

Parent `p5wm`.
