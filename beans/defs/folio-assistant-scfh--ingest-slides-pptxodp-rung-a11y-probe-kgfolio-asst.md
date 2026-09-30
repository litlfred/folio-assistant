---
# folio-assistant-scfh
title: 'INGEST SLIDES: pptx+odp rung, a11y probe, KG/folio-asst deck into library, methodology gaps, docs (#1614)'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-30T14:32:51Z
updated_at: 2026-09-30T15:01:31Z
parent: folio-assistant-slw1
---

Issue #1614. Owner supplied KG__folio-asst as .pptx and .odp. Add a slides rung to bun run ingest handling both, report accessibility, ingest the preferred (pptx) into library, list missing methodology sources, improve docs across layers.

## Done when
- [ ] slides-structure.py rung + ingest-document.ts routing + tests
- [ ] library-ingestion skill updated
- [ ] deck ingested to a library with a11y sidecar
- [ ] methodology gap list on the issue
- [ ] docs pages updated


## Follow-up on this branch (owner, 2026-09-30): ingest methodology sources 1–3 from #1614
- [ ] Mehl et al. 2021, Lancet Digit Health 3(4):e213–e216 (primary for SMART L1–L5)
- [ ] OMG BPMN 2.0.2 (ISO/IEC 19510:2013)
- [ ] OMG DMN (current version; verify 1.5) — then add it as evidence: on methodologies/dmn.md

Waiting on network access: the environment's proxy returns 403 for www.omg.org, doi.org, www.thelancet.com, europepmc.org and ncbi.nlm.nih.gov (measured 2026-09-30). Unblocks when the owner allows those hosts or uploads the PDFs.
