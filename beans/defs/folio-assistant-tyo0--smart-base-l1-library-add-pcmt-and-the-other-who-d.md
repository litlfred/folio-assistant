---
# folio-assistant-tyo0
title: 'smart-base L1 library: add PCMT and the other WHO digital transformation handbooks'
status: todo
type: task
created_at: 2026-10-01T08:37:53Z
updated_at: 2026-10-01T08:37:53Z
parent: folio-assistant-2yyh
---

Owner, 2026-10-01 (#1767): "bean to add PCMT and other who digital transformation handbooks files for smart-l1 library".

The L1 document kind is computed from smart-base library/; the library today holds 8 WHO publications. This adds the rest of the WHO digital transformation handbooks and PCMT material, through the normal ingest (bun run ingest ... --library smart-base), with provenance and licence per document.

## Done when
- [ ] the list of handbooks to add, with source URLs and licences, confirmed with the owner before ingest
- [ ] each ingested under smart-base/library/<bib-slug>/ via the ingest pipeline, never hand-written
- [ ] check:source-licence green for each
