---
# folio-assistant-s0ki
title: 'uploads visualiser: 6 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-uploads
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/uploads/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **The lead number is not what the list leads with.** The badge that leads is "22 waiting", but the default sort is `State` ascending, and `"ingested" < "waiting"`, so all 17 ingested rows come first. At 1280×800 no waiting row is above the fold. At 390 px the first waiting row is several screens down.
2. **Horizontal scroll at phone width.** At 390 px the document is 537 px wide (`scrollWidth` 537). Type, Size and Queue start off-screen, and the whole page pans sideways. (→ `folio-assistant-2r2n`)
3. **Sorting is mouse-only.** The sortable headers are bare `<th>` elements with click listeners. They have no `button`, no `tabindex` and no `aria-sort`, so a keyboard or screen-reader user cannot sort and is not told the current order. The order is shown only by the `▴`/`▾` glyph.
4. **State is carried by colour plus a word.** The pills say `waiting`/`ingested` in text, which is good. The leading badge's emphasis, however, is colour alone (`--wait` amber on "22").
5. **Size wraps inside its cell** at 1280 px for three-digit KB values ("646 / KB", "362 / KB"), because the Queue column takes the width. This makes rows uneven.
6. **Unhelpful filenames get equal weight.** Twelve waiting rows are `ChatGPT Image Sep 20, 2026, …png` or `d1a26515-….png` with no title. The table gives them the same weight as named sources, with no grouping by queue or by kind.

Related: `folio-assistant-v1hw`

When fixed, re-draw `cat-harness/docs/wireframes/uploads/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
