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
- [x] BASELINE is [] and the gate passes


## Owner ruling 2026-10-03: the three transforms stay in fhir-harness

*"keep logical-model schemas, ValueSet schemas, JSON-LD vocabularies in fhir-harness. it is only transforming existing (meta)data, not adding any new constraints or profiles (e.g. like smart guidelines does). it is generic."* Recorded in the gate's MOVED_DOWN, in ig-build-pipeline §"Five steps that came DOWN" and in dak-postprocessing. The `tools/index.ts` dak-step baseline entry is dropped (#1968).

_2026-10-04T14:02:31Z_ — Claimed by claude/salvage-1964-fhir-harness-exclusions — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-09: the gate is green again (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
litlfred/smart-base#20 set BASELINE to `[]`, but the gate, run over a git-tracked copy of fhir-harness main (162 files), still graded **1** hit: the `bpmn:import` of `../../../smart-base/.../l2-dak-authoring.bpmn` in `l3-fhir-pipeline.bpmn`. That import had been there since the seed, so whichever run reported 0 did not see the file. litlfred/fhir-harness#12 (merged c6fc6cb) drops the import. Nothing resolves it except kg-detangle's edge list. Result: **0 graded hits against baseline 0**, with 84 prose mentions reported but not graded.
**Still open:**
- **Item 4's design half:** `Task_MapL2` still carries `skill ref="l2-dak-authoring"`, and the whole process is titled for WHO SMART Guidelines. Moving that ordering into smart-base is the owner's call.
- **Items 1–2:** the test fixtures and `ingest-ig-artifacts.ts` still NAME the DAK overlay (`dak/`, `dak-api.html`) in prose and paths. The gate grades these as mentions rather than dependencies. Turning the arm into an overlay that smart-base plugs in is a refactor, not done here.
