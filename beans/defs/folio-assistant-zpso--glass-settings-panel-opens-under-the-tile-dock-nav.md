---
# folio-assistant-zpso
title: Glass settings panel opens under the tile dock (navbar wireframe, seen on the build)
status: in-progress
type: bug
priority: normal
tags:
    - wireframe-findings
    - ui
created_at: 2026-10-06T18:52:19Z
updated_at: 2026-10-06T18:52:29Z
parent: folio-assistant-4ccr
---

Recorded in the navbar wireframe's Findings ("Seen on the build, not one of the twelve"), re-drawn in #2295 (bean `folio-assistant-1q4b`); first noted in #1810 as "found, not fixed".

## Defect

At 1280×800, opening ⚙ Glass settings from the tile dock puts the panel at y = 591. Its body sits under the fixed tile dock until the reader scrolls the glass. The controls the tile has just opened cannot be reached.

## Root cause

`.fa-glass-panel` was in the glass sheet's normal flow, AFTER the shelf. The shelf has `min-height: 50vh` (it is a surface to grab even when empty), so the panel always started at least half a viewport down. The dock is `position: fixed` at the bottom and overlays that region. Focusing the panel title scrolled only the title into view (the sheet has `scroll-padding-bottom`), never the body. Every panel the strip opens (Todos, More, Filter, Glass settings) had the same placement. Glass settings is the tallest, at about 910 px in one column.

## Done when

- [ ] At 1280×800, Glass settings opens wholly above the dock's visible top edge, with the dock shown and with it hidden. Every control can be reached with no scrolling.
- [ ] At 390×844 the panel frame, its title and its × are wholly above the dock in both dock states. The content (about 940 px) is taller than the room, so the panel's own body scrolls. The glass does not scroll.
- [ ] An e2e test fails on the old placement and passes on the fix. The existing `glass*.e2e.ts`, `search-band`, `folio-mount` and `mounted-locale` e2e tests stay green.
- [ ] There are before and after screenshots at 1280 and 390.
- [ ] The navbar wireframe's Findings mark this as fixed, citing the PR.
