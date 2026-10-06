---
# folio-assistant-ei4q
title: 'LHS NAVBAR OVERLAPS CONTENT ON DESKTOP: opening the rail should shrink the content width, not cover it'
status: todo
type: bug
priority: normal
created_at: 2026-10-06T06:51:27Z
updated_at: 2026-10-06T06:51:27Z
parent: folio-assistant-9rq1
---

Owner, 2026-10-06 (https://claude.ai/code/session_012qoycyCSGidZqW245vXhze), verbatim:

> on desktop open up the LHS navbar will shrink content width so they dont overlap

## Behaviour wanted
- **Desktop (wide):** an open LHS navbar takes its own column, and the main content reflows narrower beside it. Nothing is hidden under the rail.
- **Phone:** the rail stays an overlay drawer (no room to shrink into), unless the owner says otherwise.

## Neighbours (all completed, which shows the same class of defect recurring)
- `015u`: the fixed 'Folio' handle covered page titles and content.
- `269z`: the handle covered the who-iris banner.
- `vfr8`: the LHS nav painted behind the page.

## Done when
- [ ] at desktop widths, opening the rail pushes the content (no overlap) on platform pages, folio sites and IG sites; closing it restores the full width
- [ ] at phone width the drawer behaviour is unchanged
- [ ] a Playwright check measures that the rail's and the content's rectangles do not intersect at 1280 px with the rail open
- [ ] screenshots open and closed at 1280 and 390, sent to the owner (`rendered-verification`)

Queued for later, or for an idle agent. Not separation work.
