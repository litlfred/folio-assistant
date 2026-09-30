---
# folio-assistant-db80
title: 'methodologies visualiser: 8 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-methodologies
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/methodologies/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **DIIG contradicts itself.** Its **Origin** says "Ingested at `smart-base/library/9789240010567-eng/`; every citation below resolves to a section there" (that directory exists), but its badge is "cited, not ingested" and its section ends "No ingested source … nothing in this checkout holds it". `smart-base/methodologies/diig.md` has no `evidence:` front-matter field, so the page's three-state rule reports the source as absent while the prose beside it says it is held.
2. **The column the page says to read first is cut on every row.** All ten `applies when` cells are truncated at 150 characters, often mid-word ("…the budget and the moni…", "…Contextu…", "…who answers for this, wh…"). The full text is several screens down in "Where each one came from".
3. **The MADR cell renders a stray backtick.** The cut falls inside inline code — "Not for the decision METHOD (see \`kepner-tregoe…" — leaving an unclosed backtick, which kramdown prints literally. (→ `folio-assistant-mylx`)
4. **Ingested sources are code text, not links.** `library/arxiv-2508.05192v2`, `library/dusengumuremyi-2026-ai-mediated-raci`, the two SWOT slugs and `library/arxiv-2312.07755v1` name library entries, but the reader cannot open them from here. "Source held" means "you can open it from this checkout", yet not from this page. (→ `folio-assistant-qgjh`)
5. **Section anchors sit below their headings.** The table's links go to `<a id>` elements placed after each `### title`, so a jump lands with the heading just above the viewport.
6. **Badges fail contrast on the default dark scheme.** The inline `<style>` fixes `.mv-ingested #0d6e5e`, `.mv-cited #8a6100`, `.mv-dangling #a8200f` on `#27262b`: 2.44, 2.71 and 2.06 to 1 at .72 rem. The words carry the state, but are hard to read. (→ `folio-assistant-rtuo`)
7. **Mobile: the "Choosing one" table is four columns in a 358 px column.** "origin held?" and "declared by", the evidence state the page is about, start off-screen, and nothing says the table scrolls.
8. **WireGen's origin points at nothing on this page.** It ends "Section numbers below are the paper's", written for the methodology file's own body; on this page nothing follows it but the sources list.

When fixed, re-draw `cat-harness/docs/wireframes/methodologies/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 7 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — DIIG contradicts itself (Origin says ingested; badge cited, not ingested): The DIIG section reads 'diig — declared by smart-base — cited, not ingested' / Origin '... Ingested at smart-base/library/9789240010567-eng/; every citation below resolves to a section there.' / 'No ingested source. The origin above names one; nothing in this checkout holds it.' The table badge is .mv-cited.
- **STILL-PRESENT** — 'applies when' column cut at 150 characters on every row: table:first td[applies when] lengths 146,150,149,146,145,150,131,146,144,1,146,146,150; each ends in '…' (e.g. '...the budget and the moni…', '...Contextu…', '...who answers for this, wh…'). Now 13 rows, and one row is just '…'.
- **FIXED** — MADR cell renders a stray backtick: The MADR applies-when cell now reads '... Not for the decision METHOD (see…'. Backticks in the applies-when cells: 0 of 13. — c50675273
- **STILL-PRESENT** — Ingested sources are code text, not links: There are 14 <code>library/...</code> mentions (incl. library/arxiv-2508.05192v2, dusengumuremyi-2026-ai-mediated-raci, both SWOT slugs, arxiv-2312.07755v1). All 14 have inLink false, and no <a> href contains 'library'.
- **STILL-PRESENT** — Section anchors sit below their headings; jump hides heading: <p><a id='diig'></a></p> comes after h3#diig--digital-implementation-investment-guide. After clicking the table link on a fresh page, the h3 rect is top -27/bottom -5 at 1280 (diig, madr, raci) and -21/-3 at 390 (diig, madr, wiregen). The heading is just above the viewport. Only wiregen at 1280 is visible, because i…
- **STILL-PRESENT** — Badges fail contrast on the default dark scheme: Dark (default): .mv-ingested rgb(13,110,94) is 2.44:1 on #27262b and 2.19:1 on row bg rgb(48,45,54); .mv-cited rgb(138,97,0) is 2.71:1 and 2.44:1; font 11.52 px (10.08 px at 390). Light: 6.16 and 5.54 (pass). .mv-dangling does not occur on the page now.
- **STILL-PRESENT** — Mobile: 'Choosing one' table four columns in 358 px; later columns off-screen, no scroll cue: 390x844: .table-wrapper 362 px (14..376), overflow-x auto, mask none; table scrollWidth 499. 'origin held?' at 261-404 is cut; 'declared by' at 406-511 is fully off-screen. There is no scroll hint element.
- **STILL-PRESENT** — WireGen origin ('Section numbers below are the paper's') points at nothing: The text '... Section numbers below are the paper’s.' is followed directly by 'Ingested sources: library/arxiv-2312.07755v1' and the next section.
