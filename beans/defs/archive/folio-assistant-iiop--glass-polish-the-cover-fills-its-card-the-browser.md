---
# folio-assistant-iiop
title: 'GLASS POLISH: the cover fills its card, the browser-only note is dismissable and names the missing save tool, and the tile strip is four tiles plus More'
status: completed
type: bug
created_at: 2026-09-23T12:26:57Z
updated_at: 2026-09-23T12:26:57Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-23, with screenshots of the glass over a schemas page:

> artefact avatar should cover sheet

> need to be able to dismiss: Your folio is saved in this browser only — not sent anywhere, and not visible to anyone else. should also say (no "save" tool is currently enabled)

> too many tiles!

Offered shapes, the owner chose **"Fills the card"** for the avatar and **"Few + a More tile"** for the strip.

## Done when

- [x] the cover (or kind icon) is the whole card's background; the title and tools sit above it on solid strips; book cards start portrait (4:3 upright)
- [x] a press on the title is never a drag (it stays a link); a press on the cover drags
- [x] the browser-only note has a dismiss (x) remembered per browser, adds '(No "save" tool is currently enabled.)', and Settings offers 'Show the browser-only note again'
- [x] the strip holds Todos, Filter, Settings, More; More lists every declared glass visualisation via the same renderGraphTiles
- [x] specs in glass-tiles.e2e.ts; full e2e 569/569, gates 135/135

## Summary of Changes

CSS positions the avatar against the card (inset 0, object-fit cover). defaultGlassGeom gives a book a portrait card. The local note gets a dismiss backed by fa-glass-local-note-dismissed with a Settings restore. The declared tiles moved from the strip into the More panel.
