---
# folio-assistant-gnqa
title: 'library visualiser: 6 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-library
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/library/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **Five columns are off-screen even at desktop width.** The page action is now reachable: "Pull out to folio" moved to the first cell, so finding 1 of the earlier drawing (the action past the right edge) is fixed. But the first cell is now 391 px and does not wrap, and the table has grown to 1820 px. At 1280 px **Pages**, **Words**, **Size**, **Referenced by** and **Source** are past the right edge of the scroll box, and nothing on screen shows there is more to the right.
2. **On a phone the listing is one column.** At 390 px only the first cell is in view: the cover, the slug and the pull-out button. Title, words, size, OCR and source, the metadata the listing exists to show, all need a sideways scroll inside a box. The uploads table shows only "Unit" at 390 px. (→ `folio-assistant-2r2n`)
3. **The fixed Folio handle covers the page title on a phone.** At 390 px the `▾ Folio` button sits over "Library — the L1 corpus" (it reads "Library — th… ▾ Folio …s"). At 1280 px it clears the title. (→ `folio-assistant-015u`)
4. **Entries cannot be opened.** Neither the slug, the title nor the cover is a link, in either view. Rows and cards carry a `data-fa-library-href`, but nothing on the page lets a reader reach an entry's sections or source. (→ `folio-assistant-qgjh`)
5. **The titles shown are extraction artefacts.** "Abies" is the title shown for `who-pub-tps-931` (the WHO editorial style manual, per the uploads table). "PUBLICATION AND INFORMATION" is cut short, and "Handbook forGuideline" is missing a space. The same text is also the pull-out button's accessible name ("Pull Abies out to your folio glass"). At 34 × 46 px the cover is too small to settle what an entry is, so the reader still has to cross-check against the uploads table.
6. **"Referenced by" details are in a `title` tooltip only.** The pill "1 catalogue, 1 voices" puts the referencing file paths in its `title` attribute, which touch and keyboard users cannot reach.

When fixed, re-draw `cat-harness/docs/wireframes/library/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — Five columns off-screen even at desktop width, no cue: 1280x800: the table is 1820 px wide in section.wrap (1224 px, overflow-x auto); first cell 391 px. th pages/words/size/referenced by/source start at x>=1327 (OFF) and OCR is PART. The wrap has mask-image none and box-shadow none, so there is no edge cue.
- **STILL-PRESENT** — On a phone the listing is one column (uploads shows only Unit): 390x844: box 334 px wide; only the 'slug' th is in view (56-447, partial); title..source are all OFF. Uploads table: only 'unit' is partly visible. A right-edge fade mask (linear-gradient, 40 px) is now present at 390, but the content is unchanged.
- **FIXED** — Fixed Folio handle covers the page title on a phone: 390x844: button.fa-glass-handle is at rect top 0..28, left 149..241; h1 'Library — the L1 corpus' is at top 52..81. No overlap, confirmed in a screenshot. At 1280 the handle is at 594-686, 0-28, also clear. — candidate
- **STILL-PRESENT** — Entries cannot be opened: All 3 rows carry data-fa-library-href but 0 <a> elements; tr tabIndex -1, cursor auto; the cover img is not in a link. Clicking the title cell changes neither the URL nor the page height, and opens no dialog.
- **STILL-PRESENT** — Titles shown are extraction artefacts (Abies, PUBLICATION AND INFORMATION, Handbook forGuideline): Row titles are still 'Handbook forGuideline Development 2nd edition', 'Abies' and 'PUBLICATION AND INFORMATION'. Button aria-label: 'Pull Abies out to your folio glass'. Cover img is 32x44 px.
- **STILL-PRESENT** — 'Referenced by' details in a title tooltip only: The pill span '1 catalogue, 1 voices' holds its paths only in the title attribute ('who-iris/catalogue/nodes/item-...json (1)\nwho-style-guide/skills/...'). tabIndex is -1 and it is not in a <details>.
