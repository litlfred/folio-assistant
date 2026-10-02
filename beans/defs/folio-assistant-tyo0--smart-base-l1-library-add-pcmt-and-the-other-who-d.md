---
# folio-assistant-tyo0
title: 'smart-base L1 library: add PCMT and the other WHO digital transformation handbooks'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T08:37:53Z
updated_at: 2026-10-01T19:57:43Z
parent: folio-assistant-2yyh
---

Owner, 2026-10-01 (#1767): "bean to add PCMT and other who digital transformation handbooks files for smart-l1 library".

The L1 document kind is computed from smart-base library/; the library today holds 8 WHO publications. This adds the rest of the WHO digital transformation handbooks and PCMT material, through the normal ingest (bun run ingest ... --library smart-base), with provenance and licence per document.

## Done when
- [ ] the list of handbooks to add, with source URLs and licences, confirmed with the owner before ingest
- [ ] each ingested under smart-base/library/<bib-slug>/ via the ingest pipeline, never hand-written
- [ ] check:source-licence green for each

_2026-10-01_ — Owner supplied the handbooks: commit 27078551 on main added to uploads/: 9789240093362-eng.pdf (DTH for primary health care — ALREADY in smart-base/library), 9789240101197-eng.pdf (DTH for health supply chain architecture), 9789240116191-eng.pdf (DTH for health product catalogue), and draft-for-public-comments_-reference-architecture-for-digital-public-infrastructure-for-health-guidance.pdf (Reference Architecture and Guidance for DPI-H, DRAFT V1.0 — itself 'A Digital Transformation Handbook for DPI-H'). Three are new to the library. Licence per document still to be read from each PDF before ingest. The owner also wants them as the source of a DTH voice and of methodologies/processes/glossary — see the DTH bean under qvxh.
_2026-10-01T19:57:40Z_ — Claimed by claude/awesome-fermi-ua31th-stage-d5 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
