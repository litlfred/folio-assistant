---
# folio-assistant-v0jv
title: FOLIO TILES belong to the folio edge, slid away — not in the board flow and not only in the sidebar
status: todo
type: bug
priority: normal
created_at: 2026-09-21T17:28:40Z
updated_at: 2026-09-21T17:28:40Z
---

Owner, 2026-09-21: "folios have tiles do not go to the window. they are stacked around (bottom?, again read exsiting docs/siblings/beans) of folio, slid away, open to tiles to things like fsh-gts, todos, docs, etc."

CORPUS CHECK. harness-tiles already states the rule this refines: 'Tiles render in the navbar AND on the board: one declaration, per-surface visibility, never two registries.' So the declaration side is right and must not be rebuilt. What is wrong is the board-side PLACEMENT: '.fa-board-tiles' (docs-ui.css:3762) is a flex-wrap row appended after the sticky grid, in flow. It is neither stacked at an edge nor slid away, and on the landing page it lands below every full-bleed card.

Also confirms the tiles must NOT be projected onto the glass — they are folio chrome, where a window is content.
