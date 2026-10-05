---
# folio-assistant-qbfm
title: 'tools visualiser: 6 wireframe findings'
status: todo
type: task
priority: normal
tags:
    - wireframe-findings
    - ui
    - visualiser-tools
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-30T16:12:47Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/tools/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **No way to find one tool among 71 except page search.** The only way in is a flat alphabetical table. It has no filter by invocation or by skill, and the stat boxes and invocation counts are not links into the rows they count. (→ `folio-assistant-qgjh`) (→ `folio-assistant-0fua`)
2. **Skills and tool ids are not links.** `satisfies` is rendered as `code` text. A reader who wants the skill has to copy the name and search for it. This is the very join the page exists to show. (→ `folio-assistant-qgjh`)
3. **Invocation tags fail contrast on the default dark scheme.** The page's inline `<style>` sets fixed hex colours: `.tg-shell #0d6e5e`, `.tg-mcp #6b5b95`, `.tg-inproc #1d5fa8`, `.tg-manual #a8430f`. On just-the-docs' dark body (`#27262b`, and `color_scheme: dark` in `_config.yml`), I computed 2.44, 2.54, 2.33 and 2.48 to 1, all at 11.5 px. That is below the 4.5:1 floor. The tag text carries the meaning, so colour is not the only channel, but the text itself is hard to read. (→ `folio-assistant-rtuo`)
4. **Mobile: the main table is 5 columns wide in a 358 px column.** Below 800 px, "invoked", "satisfies" and "i/o" are off-screen until the reader scrolls the table sideways. Nothing on screen says the table scrolls, and each row is several screens tall because the description column wraps to about 20 characters. (→ `folio-assistant-2r2n`)
5. **The "▾ Folio" handle overlaps the top of the content column at both widths.** It is fixed at top centre (`.fa-glass-handle`, `min-height: 3.25rem`). At 390 px it sits over the theme's top bar. (→ `folio-assistant-015u`)
6. **"On this page" (4 entries) exists only in the opened sidebar.** At rest the strip hides the page index, so on a page this long the section list is two interactions away.

When fixed, re-draw `cat-harness/docs/wireframes/tools/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 6 still present, 0 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — No way to find one tool except page search; stat boxes not links: Main has 0 input/select; main table 104 rows (was 71). Stat boxes ('104 Tool nodes', '63 skills satisfied', …) are not links; only in-page anchors are the 3 heading permalinks.
- **STILL-PRESENT** — Skills and tool ids are not links: Main table (tool|what it does|invoked|satisfies|i/o): 0/104 'satisfies' cells and 0/104 tool-id cells contain an <a>.
- **STILL-PRESENT** — Invocation tags fail contrast on dark scheme: prefers-color-scheme dark (data-fa-scheme=dark, cell bg rgb(48,45,54)): .tg-shell 2.19, .tg-mcp 2.29, .tg-inproc 2.09, .tg-manual 2.24 :1 at 11.52px (<4.5). Light scheme passes (6.16/5.91/6.45/6.04). Default now follows OS, so fails only for dark-mode readers.
- **STILL-PRESENT** — Mobile: 5-column table in 358px column, off-screen columns, no scroll cue: At 390x844 page scrollWidth 390, but .table-wrapper scrollWidth 570 vs clientWidth 362; headers at x: invoked 263, satisfies 370, i/o 477 (last two off-screen). Wrapper mask-image none (narrow-viewport.css cue excludes .table-wrapper > table). 'what it does' column 138px; tallest row 536px.
- **STILL-PRESENT** — '▾ Folio' handle overlaps top of content column: .fa-glass-handle position:fixed, top centre: 1280 → rect (594,0,93x28), min-height now 28px; #main-content starts y=140 so no overlap with content, only the empty header. 390 → rect (154,0,82x25) overlaps a.site-title 'C@T Harness' box (0,2,244x49) in the top bar. Improved on desktop, still over the top bar on mobile.
- **STILL-PRESENT** — 'On this page' (4 entries) only in the opened sidebar: details.fa-doc-index (4 links): at 390 summary visible at rest (y=96, hit-test true) — fixed on mobile. At 1280 summary at (0,299,55x58) in the collapsed strip fails hit-test (covered) and is not visible at rest.

## Re-verified 2026-09-30 on `main` 3779d5d27

Each finding re-measured on a local build of that commit (`preview-site.sh`, served at `/folio-assistant/`), at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — No way to find one tool except page search; stat boxes not links: Narrowed since 2026-09-29: the main table (107 rows) now has a 'Filter this table' input ('beans' → 3 of 107). The stat boxes are still not links, and the only in-page anchors in main are the 3 heading permalinks. — #1592 (D/p_tools.js, filt2.mjs)
- **STILL-PRESENT** — Skills and tool ids are not links: Narrowed since 2026-09-29: 105 of 107 'satisfies' cells now link to skill pages (136 links, all 61 targets return 200). 0 of 107 tool-id cells contain an <a>. — #1592 (D/p_tools.js, qgjh.mjs, linkcheck.mjs)
- **FIXED** — Invocation tags fail contrast on dark scheme: Changed since 2026-09-29. Dark (cell bg rgb(48,45,54)): .tg-shell 7.40, .tg-mcp 6.35, .tg-inproc 6.53, .tg-manual 6.53 :1 at 11.52px (10.08px at 390). Light is unchanged and passes: 6.16/5.91/6.45/6.04. — #1592 / rtuo (D/p_tools.js, contrast.mjs)
- **STILL-PRESENT** — Mobile: 5-column table in 358px column, off-screen columns, no scroll cue: At 390×844 the page scrollWidth is 390, and .table-wrapper has scrollWidth 570 vs clientWidth 362. The headers are at x invoked 263, satisfies 370, i/o 477 (the last two off-screen). The wrapper has mask-image none. The 'what it does' column is 138px, and the tallest row is now 788px (was 536). (D/p_tools.js, D/p_tw.js)
- **STILL-PRESENT** — '▾ Folio' handle overlaps top of content column: At 1280 the handle rect is (594,0,93×28) and #main-content starts at y=140, so there is no overlap with content. At 390 the rect is (154,0,82×25), over a.site-title 'C@T Harness' (0,2,244×49) in the top bar. (D/p_tools.js, D/p_handle.js)
- **STILL-PRESENT** — 'On this page' (4 entries) only in the opened sidebar: details.fa-doc-index (4 links). At 390 the summary is visible at rest (y=96, hit-test true). At 1280 the summary is at (0,299,55×58) in the collapsed strip and fails the hit-test. (D/p_tools.js)
