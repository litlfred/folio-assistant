---
# folio-assistant-zrvt
title: 'GLASS: library and todos onto the glass, a tile strip on its bottom edge, book avatars, and a settings tile'
status: in-progress
type: feature
created_at: 2026-09-23T06:47:06Z
updated_at: 2026-09-23T06:47:06Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-23, looking at `/cat-harness/library/who-iris/` with the glass pulled down:

> how do i get stuff from library onto glass? same w/ todos. where are the todo, fsh guts etc tiles on bottom of glass? check beans and finish feature implemenation. also tile to change folio settings (like background theme=now is glass theme, need usabiltiy themes some may want exisritng new avatars. should be able to set opactiy.

> library items need avatar (book's) which should use the cover or whatever is associated to it if there is something — in this case there are

Then, mid-session:

> oh it was there, hard to see -- buried onRHS to popout. when it went to glass, no avatar very hard to read. start with the glass being 20% opaque with a blur effect.

So the measurement below was right about the cause, and the default look is the owner's: **20% opacity, blurred**. Their screenshot also showed an asset's title printed straight over the library table, so things ON the glass are solid cards whatever the glass's opacity.

## Measured before building

- The pull-out control EXISTS (`j2if`, `mountLibraryPullouts`) but lands in the row's LAST cell. On the who-iris table that column is past the right edge of the viewport, so a reader sees no way to get an item onto the glass. `pb04` shape: the control exists and cannot be found.
- The glass sheet covers the page, so even a visible row button takes no click while the glass is down.
- The glass has no tiles. `v0jv` said *"the tiles must NOT be projected onto the glass"*. **The owner's 2026-09-23 message overrides that**: they expect the todo / fsh-guts / docs tiles along the glass's BOTTOM edge. Recorded as a ruling, not quietly reversed.
- Tiles reach the page only as `<meta name="fa-tiles">`, written by Jekyll. A replica page (who-iris) has no such meta, so the glass needs a published copy of the same list — not a second list.
- Todos reach the page only through `<meta name="fa-todo-src">`. Same gap.
- Every who-iris book has a cover at `who-iris/library/<slug>-cover.png` (emblem already masked, owner ruling 2026-09-21), published at `/library/who-iris/`. `library-graph.ts` records none of it.

## Done when

- [x] library row: the pull-out control is in the FIRST cell, beside a book avatar
- [x] library-graph records each entry's avatar: cover, else first figure image, else none (absent is not a guess)
- [x] glass asset card shows the avatar; no image → a book glyph, never a broken image
- [x] tile strip along the glass's bottom edge, from the SAME declared tiles (`glass` surface added to the one declaration)
- [x] tiles list published as JSON rendered from the same `_data`, so replica pages get it
- [x] todos tile opens the todo list on the glass, each with pull-out to glass
- [x] settings tile: theme (glass default + usability themes), avatar style, opacity
- [x] default glass: 20% opaque, blurred; cards solid at any opacity
- [x] e2e specs for each (`glass-tiles.e2e.ts`, 13), and `bun run gates` green (127)

## Built 2026-09-23

- **The earlier ruling is reversed, and the new one is recorded.** `v0jv`'s *"tiles must NOT be projected onto the glass"* is overridden by the owner's 2026-09-23 question about where the tiles on the glass's bottom edge were. `glass` is a third value in `TILE_SURFACES` on the ONE declaration, not a second list.
- **Two tiles are chrome, not graph tiles:** Todos and Settings. They carry `data-fa-glass-chrome`, not `data-fa-tile`. When they wore the graph tiles' marker, `graph-tiles.e2e.ts` failed, and it was right to: every `data-fa-tile` opens "the declared visualisation of" something, and these two don't.
- **Found by a gate, not by review:** the viewer's regex was mangled inside a TS template literal and shipped `/assets/library/index.json$/`, which is invalid flags. `generated-viewer-scripts.test.ts` caught it. The viewer now slices the path by length instead of using a regex.
- **Found by a gate:** the lazy `avatars.css` link was an unchecked href. `href-safety.test.ts` caught it, and the link now goes through `safeHref`.
- **Found by e2e:** a later `.fa-glass-sheet` rule overrode the strip's bottom padding, so the strip covered the settings panel's last control. The padding is now merged into that one rule, with `scroll-padding-bottom`.

## Not done

- Semantic zoom and drag on glass cards. They are still a flex row, not positioned notes. That is `pv6g`/`624f`'s part.
- The "cats" avatar option. The existing art avatars are per-THEME sticky backdrops, not per-item pictures. "Kind avatars" is the existing set that applies to an item.
