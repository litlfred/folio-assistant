---
# folio-assistant-turh
title: 'Library asset viewer: TOC, pages with labels, figures/tables, section extracts — for any ingested library/ entry (#2302)'
status: in-progress
type: feature
created_at: 2026-10-06T20:27:04Z
updated_at: 2026-10-06T20:27:04Z
parent: folio-assistant-slw1
---

Owner, #2302 session 2026-10-06: re-ingest the who-iris library with the updated method, and give ingested documents a viewer — browse page by page (with printed labels), an overview of figures/tables, the TOC linking to sections, and extracted summaries of each section. Not who-iris-specific: the viewer belongs to the ingestion SCHEMA (pdf-structure/v1 structure.json + sections/), so every library/ asset of every instance gets it; who-iris is the first consumer.

- [x] extend the existing library viewer (cat-harness/scripts/gen-library-viz.ts) with a document view built from structure.json: TOC (with confidence), pages (label, sections, figures), figures/tables, sections (summary or extract), diagnostics (alignment, gaps, label conflicts)
- [ ] re-ingest who-iris library entries with the updated pdf-structure
- [x] check it rendered (screenshots)
- [ ] tests / gates
