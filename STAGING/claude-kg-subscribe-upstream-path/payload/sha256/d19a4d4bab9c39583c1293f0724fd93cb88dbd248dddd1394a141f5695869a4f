---
# folio-assistant-kx0p
title: 'catalogue visualiser: 6 wireframe findings'
status: todo
type: task
priority: normal
tags:
    - wireframe-findings
    - ui
    - visualiser-catalogue
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-30T16:12:47Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/catalogue/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **Horizontal scroll at phone width.** At 390 px the document is 752 px wide (`scrollWidth` 752). The "Every node" table does not wrap or scroll in a container, so the whole page pans sideways, and "held as", "record" and "bitstreams" start off-screen. The three columns that tell a held item from a referenced one are the three a phone user cannot see. (→ `folio-assistant-2r2n`)
2. **The menu and breadcrumb look like links and are not.** The six items in the blue menu and the `who-iris • Catalogue` crumb are `<span>`s. The page has 4 links in all: folio-assistant, WHO IRIS, and iris.who.int twice. A reader who taps "Communities & Collections" or "who-iris" gets nothing.
3. **No row leads anywhere.** Node titles, catalogue paths and library ids ("held as") are plain text, so the 3 materialized items do not link to their library entries or their replica item pages. A reader who finds a held item here cannot reach it from here. (→ `folio-assistant-qgjh`)
4. **The node list is not filterable or sortable,** and it puts the 10 referenced rows ahead of the 3 materialized ones. At 1280×800 the first materialized row is about two screens down.
5. **About the first 280 px at 1280 (about 510 px at 390) is replica chrome** before the `h1`: banner, wordmark, menu, breadcrumb. At 390 px the `h1` starts at about y = 560, and the first table is below the first screen.
6. **The gate verdict counts have no label.** The state pills carry their word as well as a tint, so colour is not the only channel. In the gates table, though, each count follows its pill as a bare number ("PERMITTED 3 UNKNOWN 3"). It reads as one run, not as two verdicts with a count each.

When fixed, re-draw `cat-harness/docs/wireframes/catalogue/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **FIXED** — Horizontal scroll at phone width: At 390: documentElement.scrollWidth 390 (was 752). table.kg is display:block; overflow-x:auto (238px box, scrollWidth 518), so only the table scrolls. Residual: 'held as' (x 393), 'record', 'bitstreams' still start off-screen inside the table scroller, and the nav rail takes 56px. — 76b34f8ec
- **STILL-PRESENT** — The menu and breadcrumb look like links and are not: 'Communities & Collections' and 'who-iris' crumb are leaf <span>s with no <a> ancestor. Page links are now 30, but all added ones are site nav rail; replica menu/crumb still inert.
- **STILL-PRESENT** — No row leads anywhere: All 3 tables: 0 a[href] inside (states, gates, every-node 14 rows incl. 3 MATERIALIZED).
- **STILL-PRESENT** — The node list is not filterable or sortable, and puts referenced ahead of materialized: No input/select/button in tables (only visible input is the nav checkbox); no th[aria-sort]. Row order: 10 REFERENCED then 3 MATERIALIZED; first materialized row at y=1866 at 1280 (~2.3 screens), y=4217 at 390.
- **STILL-PRESENT** — About the first 280 px is replica chrome before the h1: h1 'The catalogue, as a graph' top at y=319 at 1280 and y=615 at 390.
- **STILL-PRESENT** — The gate verdict counts have no label: Gates row markup: <span class='state materialized'>permitted</span> 2 <span class='state referenced'>refused</span> 4 — bare numbers, row text 'copyright PERMITTED 2 REFUSED 4'.

## Re-verified 2026-09-30 on `main` 3779d5d27

Each finding re-measured on a local build of that commit (`preview-site.sh`, served at `/folio-assistant/`), at 1280×800 and 390×844, both colour schemes where contrast is involved. 4 still present, 2 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **FIXED** — Horizontal scroll at phone width: Still fixed. At 390 documentElement.scrollWidth is 390, and table.kg is display:block; overflow-x:auto (238px box, scrollWidth 518). 'held as' (x 393), 'record' and 'bitstreams' still start off-screen inside the table scroller. — 76b34f8ec (rv-cat.mjs, rv-cat2.mjs)
- **STILL-PRESENT** — The menu and breadcrumb look like links and are not: 'Communities & Collections' and the 'who-iris' crumb are still leaf <span>s with no <a> ancestor. (rv-cat.mjs)
- **FIXED** — No row leads anywhere: Changed since 2026-09-29. The every-node table now has 11 links. 5 of 13 node titles (both collections and all 3 items) link to their replica page under /library/who-iris/, and all return 200. The 3 'held as' cells link to the library viewer and the item page. The 8 community rows are still plain text, and the state and gate tables have 0 links. — #1592 (rv-cat.mjs, cat3.mjs, linkcheck.mjs)
- **STILL-PRESENT** — The node list is not filterable or sortable, and puts referenced ahead of materialized: There is no input/select/button in the tables and no th[aria-sort]. The #1592 filter is not on this page. The rows are still 10 REFERENCED then 3 MATERIALIZED. The first materialized row is at y=1889 at 1280 and y=4217 at 390. (rv-cat.mjs, filt.mjs)
- **STILL-PRESENT** — About the first 280 px is replica chrome before the h1: The h1 'The catalogue, as a graph' still starts at y=319 at 1280 and y=615 at 390. (rv-cat.mjs)
- **STILL-PRESENT** — The gate verdict counts have no label: The gates rows still read 'copyright PERMITTED 2 REFUSED 4', 'restrictions PERMITTED 2 REFUSED 4', 'retention PERMITTED 6', as bare numbers after state spans. (rv-cat.mjs)
