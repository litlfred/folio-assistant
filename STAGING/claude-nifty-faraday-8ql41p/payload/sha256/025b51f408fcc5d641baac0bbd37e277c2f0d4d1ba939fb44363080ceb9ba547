---
# folio-assistant-s0ki
title: 'uploads visualiser: 6 wireframe findings'
status: todo
type: task
priority: normal
tags:
    - wireframe-findings
    - ui
    - visualiser-uploads
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-30T16:12:47Z
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

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — Lead number is not what the list leads with: Lead badge '16 waiting to be ingested'; default sort 'State ▴' puts all 34 ingested rows first (order iiii…×34 then w×16). First waiting row at y=2741 at 1280x800, y=4114 at 390x844.
- **FIXED** — Horizontal scroll at phone width: At 390x844 document scrollWidth 390 (was 537); the table is its own scroll box (scrollWidth 630 / clientWidth 302). Caveat: Type (x=527), Size (578), Queue (626) still start off-screen inside it. — 76b34f8ec
- **STILL-PRESENT** — Sorting is mouse-only: 6 thead th: tabindex null, aria-sort null, no <button>, no role, on all; order shown only by '▴' glyph in 'State ▴'.
- **STILL-PRESENT** — Lead badge emphasis is colour alone: .badge.lead b colour rgb(154,103,0) vs other badges rgb(31,35,40); font-weight 700 on all four — colour is the only difference. Contrast 4.57:1 on #f6f8fa (light), 6.85:1 dark.
- **STILL-PRESENT** — Size wraps inside its cell at 1280: Worse: at 1280 the Size column is 64px wide and 48 of 50 size cells wrap to two lines (e.g. '3.6 / MB', '646 / KB'; row screenshot confirms), white-space normal.
- **STILL-PRESENT** — Unhelpful filenames get equal weight, no grouping: 12 rows named 'ChatGPT Image …' or a UUID; single tbody, 0 group rows/captions; 50 rows.

## Re-verified 2026-09-30 on `main` 3779d5d27

Each finding re-measured on a local build of that commit (`preview-site.sh`, served at `/folio-assistant/`), at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — Lead number is not what the list leads with: The lead badge reads '22 waiting to be ingested' (was 16). The default sort 'State ▴' puts all 34 ingested rows first. The first waiting row is at y=2741 at 1280×800 and y=4114 at 390×844. (D/p_up.js)
- **FIXED** — Horizontal scroll at phone width: Still fixed. At 390×844 the document scrollWidth is 390, and the table is its own scroll box (630/302). Type (x=527), Size (578) and Queue (626) still start off-screen inside it. — 76b34f8ec (D/p_up.js)
- **STILL-PRESENT** — Sorting is mouse-only: All 6 thead th have tabindex null and aria-sort null, with no <button> and no role. The order is shown only by the '▴' glyph in 'State ▴'. (D/p_up.js)
- **STILL-PRESENT** — Lead badge emphasis is colour alone: .badge.lead b is rgb(154,103,0) vs rgb(31,35,40) for the other badges, and all four are font-weight 700. The contrast is 4.57:1 on #f6f8fa (light) and 6.85:1 in dark. (D/p_up.js, D/p_up2.js)
- **STILL-PRESENT** — Size wraps inside its cell at 1280: At 1280 the Size column is 64px wide, and 51 of 56 size cells wrap to two lines (e.g. '3.6 MB'), white-space normal. (D/p_up.js, D/p_up2.js)
- **STILL-PRESENT** — Unhelpful filenames get equal weight, no grouping: 12 rows are named 'ChatGPT Image …' or a UUID. There is a single tbody with 0 group rows or captions, over 56 rows (was 50). (D/p_up.js)
