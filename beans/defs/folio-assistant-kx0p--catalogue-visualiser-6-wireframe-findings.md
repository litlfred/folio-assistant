---
# folio-assistant-kx0p
title: 'catalogue visualiser: 6 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-catalogue
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
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
