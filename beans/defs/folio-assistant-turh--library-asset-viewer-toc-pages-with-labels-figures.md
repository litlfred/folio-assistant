---
# folio-assistant-turh
$schema: bean/1.0.0
title: 'Library asset viewer: TOC, pages with labels, figures/tables, section extracts — for any ingested library/ entry (#2302)'
status: completed
type: feature
created_at: 2026-10-06T20:27:04Z
updated_at: 2026-10-20T11:30:00Z
parent: folio-assistant-slw1
---

Owner, #2302 session 2026-10-06: re-ingest the who-iris library with the updated method, and give ingested documents a viewer — browse page by page (with printed labels), an overview of figures/tables, the TOC linking to sections, and extracted summaries of each section. Not who-iris-specific: the viewer belongs to the ingestion SCHEMA (pdf-structure/v1 structure.json + sections/), so every library/ asset of every instance gets it; who-iris is the first consumer.

- [x] extend the existing library viewer (cat-harness/scripts/gen-library-viz.ts) with a document view built from structure.json: TOC (with confidence), pages (label, sections, figures), figures/tables, sections (summary or extract), diagnostics (alignment, gaps, label conflicts)
- [x] re-ingest who-iris library entries with the updated pdf-structure
- [x] check it rendered (screenshots)
- [x] tests / gates

_2026-10-20T11:30:00Z_ — Completed (owner "1", 2026-10-20 09:36Z, https://claude.ai/code/session_01Ln5dzJ3LfmeMEC86FUNsg3). Re-ingest: wpr-rdo and the handbook already carried `pages[]`; the scanned `who-pub-tps-931` did not, because OCR text has no margins to read a folio from. cat-harness-tools#446 reads it from the page's first and last lines, and who-iris#68 re-ingested the entry with `pdf-structure.py --ocr` (physical 15–121 → printed 10–116). Tests: `scripts/tests/library-document.test.ts` (the document view) and `scripts/tests/pdf-ocr-page-labels.test.py`; gate `library:readmes:check` caught the stale README in #68.
