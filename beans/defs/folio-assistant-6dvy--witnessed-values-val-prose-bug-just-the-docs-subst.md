---
# folio-assistant-6dvy
title: 'Witnessed values (:val): prose bug, just-the-docs substitution, namespacing by source'
status: in-progress
type: task
created_at: 2026-09-30T10:08:52Z
updated_at: 2026-09-30T10:08:52Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: fix the platform; first analyze consistency with the just-the-docs pipeline, and how to namespace values by source (paper, dataset e.g. CODATA with provenance via ingestion, FHIR IG metadata).

## Done when
- [x] prose :val resolves names with underscores (render-latex), tested and calibrated
- [ ] consistency analysis across PDF / just-the-docs / blueprint / FHIR IG, recorded
- [ ] namespacing-by-source design, owner decision recorded
- [ ] just-the-docs render path substitutes :val
- [ ] blueprint export wired into the folio blueprint.yml (#1492)
