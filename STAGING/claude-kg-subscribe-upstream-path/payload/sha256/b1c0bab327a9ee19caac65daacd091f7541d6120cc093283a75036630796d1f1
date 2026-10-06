---
# folio-assistant-veiu
title: 'FHIR-HARNESS: clear the exclusion-gate baseline to zero (wm63 stream 2)'
status: in-progress
type: task
priority: high
created_at: 2026-10-03T08:54:49Z
updated_at: 2026-10-04T14:02:31Z
parent: folio-assistant-wm63
---

The gate `check:fhir-harness-exclusions` (smart-base/scripts/) was turned on 2026-10-03 in ratchet mode over 9 file×rule pairs (20 graded hits) listed in smart-base/scripts/fhir-harness-exclusions.baseline.ts. Owner ruling 2026-10-03: gate now, clear the hits in a second stream (session https://claude.ai/code/session_01PpaL9j6AhiTfvqnkF7BiaG).

## Done when

- [ ] the WHO test fixtures (4 test files) use a non-WHO IG
- [ ] ingest-ig-artifacts.ts no longer names the DAK API sidecars — the arm is an overlay smart-base plugs in
- [x] tools/index.ts: owner rules on the three DAK post-processing Tools (generate_logical_model_schemas, generate_valueset_schemas, generate_jsonld_vocabularies) — move them up to smart-base, OR record them as having come DOWN like the Library strippers (then MOVED_DOWN in the gate and ig-build-pipeline both say so)
- [ ] l3-fhir-pipeline.bpmn's import of smart-base's l2-dak-authoring.bpmn resolved, with the owner's OK
- [ ] BASELINE is [] and the gate passes


## Owner ruling 2026-10-03: the three transforms stay in fhir-harness

*"keep logical-model schemas, ValueSet schemas, JSON-LD vocabularies in fhir-harness. it is only transforming existing (meta)data, not adding any new constraints or profiles (e.g. like smart guidelines does). it is generic."* Recorded in the gate's MOVED_DOWN, in ig-build-pipeline §"Five steps that came DOWN" and in dak-postprocessing. The `tools/index.ts` dak-step baseline entry is dropped (#1968).

_2026-10-04T14:02:31Z_ — Claimed by claude/salvage-1964-fhir-harness-exclusions — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
