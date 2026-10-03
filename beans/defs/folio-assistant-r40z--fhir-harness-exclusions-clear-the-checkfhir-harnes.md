---
# folio-assistant-r40z
title: 'FHIR-HARNESS EXCLUSIONS: clear the check:fhir-harness-exclusions baseline to zero (#1963)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T08:54:48Z
updated_at: 2026-10-03T08:54:59Z
parent: folio-assistant-wm63
---

Issue #1963. Hits 1-4 of the exclusion gate's baseline (fhir-harness/skills/fhir-ig-base/ig-build-pipeline.md §refuses).

## Done when
- [ ] 2: fhir-harness test fixtures use a non-WHO IG (hl7.fhir.uv.ips); committed-WHO-data assertions moved to smart-base, none weakened
- [ ] 1: DAK API sidecar arm of ingest-ig-artifacts moves to a smart-base overlay (after #1766; check r939)
- [ ] 3: neutral prose in tools/index.ts and gen-ig-pages.ts (after #1766)
- [ ] 4: l3-fhir-pipeline -> l2-dak-authoring fix proposed; owner decides
- [ ] after the gate PR merges: merge main, delete cleared baseline entries
