---
# folio-assistant-81t5
title: 'TOOL 8/13: ingest-extract-structure — document ingestion (15 files, 7 entry points)'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:34:56Z
updated_at: 2026-09-20T04:34:56Z
parent: folio-assistant-d308
---

Group 8 of 13 in `d308`. **15 files, 7 entry points.**

`pdf-extract`, `pdf-ocr`, `pdf-pages`, `pdf-structure`, `pdf-tables`,
`split-pdf-by-chapter`, `extract-candidates`, `tabular-records`,
`archive-contents`, `ingest-document`, `scan-repo-content`,
`smart-base-transform`, `_pdf_doc_id`, `_pypdf_compat`, `_tech_meta`,
`pypdf_safe`.

**BPMN:** `ingest-extract-structure · Task_ExtractText · Task_Ocr ·
Task_Candidates` — three `serviceTask`s. Also `document-ingestion` and
`ingest-derive-content`.

**Target repo (#223):** `folio-assist-core`.

**Partly done already, and that is the point:** `main` added `ingest-stdlib` and
its paired Tool on 2026-09-19 with a measured dependency posture (three installs
to reach a working image extractor: `pypdf`, then `cffi` — whose absence makes
`cryptography` panic on IMPORT under pyo3 — then `Pillow`). So this group has a
worked example of the split-by-dependency-boundary pattern IN the graph already.
This bean is the rest of it, not the start of it.

## Done when
- [ ] the remaining entry points reachable through a Tool node
- [ ] `alternativeTo` wired to the existing ingest pair where the arms genuinely overlap
- [ ] `requires.runtime` honest about Python deps, per bean `68dt`
- [ ] `tool-coverage` reflects it
