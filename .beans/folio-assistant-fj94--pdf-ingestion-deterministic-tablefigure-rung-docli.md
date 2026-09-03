---
# folio-assistant-fj94
title: 'PDF ingestion: deterministic table/figure rung + Docling capability probe'
status: completed
type: task
priority: normal
created_at: 2026-08-26T20:40:19Z
updated_at: 2026-08-26T21:03:21Z
---

Claimed by `claude/pdf-ingestion-pipeline-y6koyj`.


## What landed

- `scripts/pdf-tables.py` — `pdf-tables/v1` beside `structure.json`: cell
  matrices, column edges, bboxes, captions, `section_id` joined from
  `structure.json`, and a GFM rendering `render-latex.ts` already turns into a
  `tabular`. Two backends (pdfplumber default, camelot-py preferred when
  present for its per-table accuracy score); multi-page stitching over column
  geometry with three guards; `tables: null` vs `[]` so an unparsed document
  can never read as an empty one.
- `.claude/skills/capabilities/{pdfplumber,camelot,docling}.json` — the docling
  probe deliberately also requires `huggingface.co` to answer, because the
  package importing is not the capability.
- `scripts/tests/pdf-tables.test.py` — 38 cases, standalone (CI has neither
  backend). Verified to fail when the reading-order fix is reverted.
- `docs/proposals/rag-document-ingestion.md` §12.26 + §4.2 rows.
- `skills/folio-paper-adapter/document-intake.md` Stage 3 + checklist.

## Still open

- **Never run against a corpus.** This repo carries no folio, so verification is
  a synthetic fixture. §12.26 names the four numbers a corpus run would settle
  (lines-vs-text recall, caption miss rate, `COL_TOL_PT`, vector-cluster
  precision).
- `structure.json` does not consume `tables.json`; consumers join on
  `section_id`. Folding them together means either making pypdf-only Stage 1
  depend on a table backend or reasoning about two SHAs.
- Not exposed as an MCP tool — the integration point is the skill, matching
  `pdf-extract.py` and `pdf-ocr.py`.


Merged as `a553883` via PR #140 with all four CI gates green on `72c6b4d`.
Follow-up (corpus run) is unclaimed and needs a folio repo — not carried here.
