---
# folio-assistant-tyo0
title: 'smart-base L1 library: add PCMT and the other WHO digital transformation handbooks'
status: completed
type: task
priority: normal
created_at: 2026-10-01T08:37:53Z
updated_at: 2026-10-04T10:16:00Z
parent: folio-assistant-2yyh
---

Owner, 2026-10-01 (#1767): "bean to add PCMT and other who digital transformation handbooks files for smart-l1 library".

The L1 document kind is computed from smart-base library/; the library today holds 8 WHO publications. This adds the rest of the WHO digital transformation handbooks and PCMT material, through the normal ingest (bun run ingest ... --library smart-base), with provenance and licence per document.

## Done when
- [x] the list of handbooks to add, with source URLs and licences, confirmed with the owner before ingest
- [x] each ingested under smart-base/library/<bib-slug>/ via the ingest pipeline, never hand-written
- [x] check:source-licence green for each

_2026-10-01_ — Owner supplied the handbooks: commit 27078551 on main added to uploads/: 9789240093362-eng.pdf (DTH for primary health care — ALREADY in smart-base/library), 9789240101197-eng.pdf (DTH for health supply chain architecture), 9789240116191-eng.pdf (DTH for health product catalogue), and draft-for-public-comments_-reference-architecture-for-digital-public-infrastructure-for-health-guidance.pdf (Reference Architecture and Guidance for DPI-H, DRAFT V1.0 — itself 'A Digital Transformation Handbook for DPI-H'). Three are new to the library. Licence per document still to be read from each PDF before ingest. The owner also wants them as the source of a DTH voice and of methodologies/processes/glossary — see the DTH bean under qvxh.
_2026-10-01T19:57:40Z_ — Claimed by claude/awesome-fermi-ua31th-stage-d5 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes

Closed 2026-10-04 on evidence, by the wm63 session.
- **List:** the owner supplied it, as the four PDFs added in commit 27078551. Three were new to the library.
- **Ingest:** #1826 (merge 019024ef507) put 9789240101197-eng (156 sections), 9789240116191-eng (124) and who-dpi-h-reference-architecture-draft-v1 (258) under smart-base/library/ through the ingest pipeline.
- **Licences:** each manifest records a stated licence with its basis quoted from the PDF's imprint page; 9789240101197-eng, for example, is CC-BY-NC-SA-3.0-IGO, from p.4. `check:source-licence` exits 0, and none of the three is among its unknowns.
