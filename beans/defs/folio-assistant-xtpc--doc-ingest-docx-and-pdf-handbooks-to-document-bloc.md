---
# folio-assistant-xtpc
title: 'DOC INGEST: .docx and PDF handbooks to document blocks with content-derived ids — and document-intake out of the paper adapter'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:54Z
updated_at: 2026-09-22T21:09:45Z
parent: folio-assistant-q4jm
---

Owner: *"doc ingest"*. A DAK narrative or an L1 handbook arrives as a .docx or
PDF. Until it is blocks in the folio/ graph, there is nothing to diff, anchor
comments to, or heat-map.

**Measured 2026-09-22.**
- `document-intake` lives in **folio-paper-adapter/**, not
  folio-document-adapter/. An L1 handbook is a `document` folio, so the skill
  is in the wrong adapter for its main customer.
- The slw1 epic has nine per-format arms: audio, images, CSV, archives and so
  on. **None is .docx.**
- `pdf-structure.py` splits a PDF into `sections/NN-slug.md`. `NN` is a
  POSITION, so inserting a section renumbers every section after it. That is
  exactly the id drift child 01 exists to catch.

**What.**
- A .docx arm: heading hierarchy, tables and figures become blocks.
- Move or generalise `document-intake` into the document adapter.
- Ids are minted from a **content-derived anchor** (heading path plus a
  normalised text hash, with a collision suffix), never from position. On
  re-ingest, an existing id is **looked up** in the folio/ graph before a new
  one is minted.

Parented here rather than under slw1 because the constraint that makes it
hard is REVIEW identity. slw1 is the sibling to read alongside it, and apui is
the entry point it plugs into.

## Done when
- [ ] a .docx upload becomes document blocks through the apui entry point
- [ ] document-intake is reachable from the document adapter
- [ ] re-ingesting an unchanged document passes `id-reingest-stable` (child 01)
- [ ] re-ingesting with one inserted section changes the ids of exactly that section's blocks


## Also issue #197 (roast R9)

The owner's #197 asks for exactly this, plus provenance **to page and line of the rendered source** on every extracted node, applied to PDF ingestion too, *"to make review and adjuducation processes easier to follow"*. Also *"basic formatting (bold, italic) preserved … not 1:1"*, and *"open format versions only for now"* (.docx, not .doc). Its comment tags @ritikarawlani for any schema change to the paper .ts content type.

- [ ] every ingested node carries source page and line provenance
