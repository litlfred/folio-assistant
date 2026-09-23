---
# folio-assistant-0rxe
title: 'DIFF RENDERER: visual (pixel) diff — before/after screenshots overlaid, for figures, diagrams and tables whose markup diff is meaningless'
status: todo
type: task
created_at: 2026-09-23T10:00:13Z
updated_at: 2026-09-23T10:00:13Z
parent: folio-assistant-q4jm
---

Child of d903 (renderer 5 of the five it listed).

Needs, before it can be built:
- screenshots of each changed block on both sides, taken in the staging job (Chromium is available there), cropped to the block's anchor;
- a pixel-compare library (pixelmatch or similar): a DEPENDENCY decision, with NOTICE / THIRD-PARTY-NOTICES to follow; the owner decides;
- a registry entry with a new `needs` input (`screenshots`), defaulting for figure and diagram.

Side by side (shipped in d903) covers most of the reviewer's need meanwhile.

## Done when
- [ ] the dependency is approved or a no-dependency compare is chosen
- [ ] the staging job publishes block screenshots
- [ ] an overlay/slider renderer is registered and tested in the browser
