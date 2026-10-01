---
# folio-assistant-6306
title: 'METHODOLOGY NODES for the three W3C sources: PROV-O (QA provenance), ODRL (permissions), JSON-LD (KG serialisation)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T08:12:46Z
updated_at: 2026-10-01T08:12:53Z
parent: folio-assistant-scfh
---

#1744 merged red: library-ref.test.ts 'the PLATFORM's library holds ONLY sources its methodologies cite' fails on w3c-2013-prov-o, w3c-2018-odrl-model-2-2, w3c-2020-json-ld-1-1. Owner chose option C (#1614): write three real methodology nodes in cat-harness/methodologies/, each grounded in the held source and in how the platform actually uses the standard.

## Done when
- [ ] prov-o node, evidence: library/w3c-2013-prov-o
- [ ] odrl node, evidence: library/w3c-2018-odrl-model-2-2
- [ ] json-ld node, evidence: library/w3c-2020-json-ld-1-1
- [ ] library-ref.test.ts green; check:methodology-evidence reports them; regen fixed point
