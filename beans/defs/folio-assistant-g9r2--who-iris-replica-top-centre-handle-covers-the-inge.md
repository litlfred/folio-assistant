---
# folio-assistant-g9r2
title: 'who-iris replica: top-centre handle covers the INGESTED COPY banner and a link; 3 replica pages scroll sideways at 390'
status: todo
type: bug
created_at: 2026-09-29T23:07:47Z
updated_at: 2026-09-29T23:07:47Z
parent: folio-assistant-4ccr
---

Measured 2026-09-29 on a local build of main 35402147f.

1. **The handle is back over the replica's own banner.** 2vne (owner 2026-09-27) moved the ▾ Folio handle back to top-centre as a short pill. On `who-iris/collection-collection-hq-publications.html` at 390×844 it covers the "INGESTED COPY — not WHO" text, which is 269z's original defect. At 1280×800 its box contains the centre of the "folio-assistant" link, so a click there lands on the handle. The other five pages checked (home, tools, a process page, glossary/skills, the library index) are clear at both widths. 2vne does not mention the replica.
2. **Three replica pages scroll sideways at 390** (6 of 395 pages, each built twice under `library/who-iris/` and `who-iris/`): collection-collection-hq-publications (scrollWidth 537, a `span.none` 457 px wide), collection-collection-wpro-information-products (420, a `code` element), and community-list (537, a `code` element). 2r2n and xwrt had this at 0.

Constraint: jpjt, a replica is unchanged while the glass is closed. The fix may not alter the replica's content. It has to move or inset the handle, or scope the narrow-viewport rules.
