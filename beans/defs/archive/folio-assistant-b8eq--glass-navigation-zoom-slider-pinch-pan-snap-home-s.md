---
# folio-assistant-b8eq
title: 'GLASS NAVIGATION: zoom (slider + pinch), pan, snap home; sticky-note todo avatar; tiles drag between strip and More; strip slides away by button'
status: completed
type: task
priority: normal
created_at: 2026-09-23T18:51:18Z
updated_at: 2026-09-23T19:13:09Z
parent: folio-assistant-6lb8
---

## The ask, owner 2026-09-23 (verbatim)

> need to be able to zoom in and out of folio and move it around (plus snap back to home). slider and two finger. todos should have stick note avatar. should be able to drag and drop "more" tiles between it and bottom. bottom flip panel should be togglebe to stay open, but should slide away

Owner's choices when asked:
- the strip slides away **only by a button** (it never auto-hides)
- **only More is fixed** on the strip; every other tile may move either way

## Done when

- [x] the glass surface zooms by a slider and by a two-finger pinch, and pans by drag or two fingers
- [x] a Home control snaps back to 100% at the origin
- [x] zooming out lets semantic zoom switch cards to avatars
- [x] a todo on the glass shows a sticky-note avatar
- [x] tiles move between the strip and More by drag, and by a button for anyone who cannot drag (WCAG 2.5.7)
- [x] More cannot leave the strip
- [x] the strip slides away and back by one button, and the choice is remembered
- [x] all of it works from the keyboard, and passes axe in both schemes

## Summary of Changes

Built 2026-09-23 in one PR, against issue #1154.

- **Zoom and pan.** There is a zoom bar at the top of the glass: − / slider / + / readout / **⌂ Home**. Pinch with two fingers, drag on empty glass, or Ctrl + wheel (a trackpad pinch). It is one transform on the shelf, and no card's saved geometry is ever rewritten, so Home really does undo it. The view is remembered in this browser. Zooming out turns cards into their avatars through the existing semantic zoom, because that measures rendered width. `wireMove` divides by the scale, so a dragged card stays under the pointer, and it stands still while two fingers pinch.
- **Phone.** The glass's zoom is off there: the browser's own pinch zooms the column, and two answers to one gesture would fight.
- **Sticky-note avatar for todos**, drawn in CSS only: note yellow, a folded corner and ruled lines. It appears on the glass card and in the Todos panel.
- **Tiles move between the strip and More**, by drag (a mouse moves 6px; a finger holds for 350ms) and by pressing: every More tile has a "Strip" button, and More lists the strip's tiles with a "More" button (WCAG 2.5.7). More is fixed. Focus follows a moved tile. The arrangement is remembered in this browser.
- **The strip slides away by one button only**, as the owner chose. A "Hide tiles" / "Show tiles" tab rides above it in a fixed dock, so the way back stays on screen. A hidden strip is `inert`, and the choice is remembered.
- **One pre-existing defect fixed:** the card shelf carried `aria-label` with no role (axe `aria-prohibited-attr`). It was found the first time axe measured an open glass, and the shelf is now `role="group"`.

Verified: `glass-navigation.e2e.ts` passes 22/22. Three mutations each turn their spec red: pinch without distance, drag without the scale, and a hidden strip that is not inert. The full e2e suite passes 620/620, and `bun run gates` passes 135/135.
