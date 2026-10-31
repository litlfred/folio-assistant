---
# folio-assistant-inkl
$schema: bean/1.0.0
title: 'INGEST: TOC extractor defects 2-5, including the DAK contents collapsing past the trust tests'
status: completed
type: task
priority: high
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-30T14:20:00Z
parent: folio-assistant-slw1
---

Bean for folio-assistant#2302. The core work is merged (#2303, #2388, cat-harness-tools#803). These four of the five defects ritikarawlani measured on 2026-10-07 are still open:

## Done when
- [x] (2) levels are consistent with nesting
- [x] (3) a running header is no longer read as a contents entry (DDCC)
- [x] (4) no entry is left without a section
- [x] (5) the DAK's contents no longer collapse from 21 entries to 8 sections, and a trust test fails on that shape. This is the serious one: a degenerate tree passed all three trust tests (the 6xaz shape).

The test PDFs are in litlfred/smart-immunizations, so a session needs that repo attached.

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)

## Resolution

Fixed in [`litlfred/cat-harness-tools#900`](https://github.com/litlfred/cat-harness-tools/pull/900) (`4d290f4`, branch `fix/inkl-toc-defects-2-5`):

- **Fourth trust test (`inferred_toc_trust`, `TOC_MAX_COLLAPSED_SHARE = 0.25`)**: refuses inferred TOC trees when more than 25% of entries fail to locate a body section (`pdf-toc-verdict.test.py` arm 11 watched fail red first, then pass green).
- **Defect 2 (`_pdf_headings.py`)**: replaced `round(x / 6)` bucket splitting with `_cluster(..., gap=6.0)` on contents `x0` coordinates, learned each indentation column's depth from its numbered entries (`1` when depth-1 entries sit in that column, else modal depth), and ran `tree_levels` in both `contents_headings` and `consensus_headings`.
- **Defect 3 (`_pdf_headings.py`)**: excluded top/bottom page-margin lines (`y1 < 0.06 * page_height` or `y0 > 0.94 * page_height`) and `running_furniture` rows in `contents_headings`, and rejected leaderless `<Month> <YYYY>` date lines (`RE_MONTH_YEAR`, e.g. `"... 27 August 2021"`) in `_parse_entry`.
- **Defect 4 (`_pdf_headings.py`, `pdf-structure.py`)**: learned `roman_offset` for front-matter Roman numeral page targets (`iv`, `v`, `vi`, `vii`, `viii`, `xi`), allowed tight-leaded multi-line display headings to merge in `font_headings`, indexed merged `font_headings` in `consensus_headings` and `contents_alignment`, and matched 2–3 line wrapped headings and minor wording inflections in `_hits` and `locate_heading` (preferring `e.page` before neighboring pages).
- **Defect 5 (`_pdf_headings.py`, `pdf-structure.py`)**: required `r.style == pending.style` when joining wrapped contents lines so 16pt `"Part 1. Overview..."` does not merge into 9pt `"Background"`, added `component` to `RE_NUM` and `norm_title` so `"Component 1..8"` split as top-level numbered entries (`number="1".."8"`, `level=1`), and added `_adjust_banner_mark` so page-opening display banners emitted at the end of a page's PDF content stream cut at `(pi, 0)` and retain the page's body (including `§1.1` and `§1.2` in DAK Component 1, pp. 26–28).
- **Measured on the three `litlfred/smart-immunizations` PDFs**:
  - LNOB (`9789240016514-eng.pdf`): 26 TOC entries → 26 body sections (+ front matter = 27), 0 missing, mean confidence `0.929`.
  - DAK (`9789240099456-eng.pdf`): 21 TOC entries → 21 body sections (+ front matter = 22), 0 missing, mean confidence `0.912`, `empty_section_share = 0.000`.
  - DDCC (`WHO-2019-nCoV-Digital-certificates-vaccination-2021.1-eng.pdf`): 45 TOC entries → 45 body sections (+ front matter = 46), 0 missing, mean confidence `0.937`.
