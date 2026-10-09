---
# folio-assistant-veiu
title: 'FHIR-HARNESS: clear the exclusion-gate baseline to zero (wm63 stream 2)'
status: completed
type: task
priority: high
created_at: 2026-10-03T08:54:49Z
updated_at: 2026-10-04T14:02:31Z
parent: folio-assistant-wm63
---

The gate `check:fhir-harness-exclusions` (smart-base/scripts/) was turned on 2026-10-03 in ratchet mode over 9 file×rule pairs (20 graded hits) listed in smart-base/scripts/fhir-harness-exclusions.baseline.ts. Owner ruling 2026-10-03: gate now, clear the hits in a second stream (session https://claude.ai/code/session_01PpaL9j6AhiTfvqnkF7BiaG).

## Done when

- [x] the WHO test fixtures (4 test files) use a non-WHO IG
- [x] ingest-ig-artifacts.ts no longer names the DAK API sidecars — the arm is an overlay smart-base plugs in
- [x] tools/index.ts: owner rules on the three DAK post-processing Tools (generate_logical_model_schemas, generate_valueset_schemas, generate_jsonld_vocabularies) — move them up to smart-base, OR record them as having come DOWN like the Library strippers (then MOVED_DOWN in the gate and ig-build-pipeline both say so)
- [x] l3-fhir-pipeline.bpmn's import of smart-base's l2-dak-authoring.bpmn resolved, with the owner's OK
- [x] BASELINE is [] and the gate passes


## Owner ruling 2026-10-03: the three transforms stay in fhir-harness

*"keep logical-model schemas, ValueSet schemas, JSON-LD vocabularies in fhir-harness. it is only transforming existing (meta)data, not adding any new constraints or profiles (e.g. like smart guidelines does). it is generic."* Recorded in the gate's MOVED_DOWN, in ig-build-pipeline §"Five steps that came DOWN" and in dak-postprocessing. The `tools/index.ts` dak-step baseline entry is dropped (#1968).

_2026-10-04T14:02:31Z_ — Claimed by claude/salvage-1964-fhir-harness-exclusions — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-09: the gate is green again (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
litlfred/smart-base#20 set BASELINE to `[]`, but the gate, run over a git-tracked copy of fhir-harness main (162 files), still graded **1** hit: the `bpmn:import` of `../../../smart-base/.../l2-dak-authoring.bpmn` in `l3-fhir-pipeline.bpmn`. That import had been there since the seed, so whichever run reported 0 did not see the file. litlfred/fhir-harness#12 (merged c6fc6cb) drops the import. Nothing resolves it except kg-detangle's edge list. Result: **0 graded hits against baseline 0**, with 84 prose mentions reported but not graded.
**Still open:**
- **Item 4's design half:** `Task_MapL2` still carries `skill ref="l2-dak-authoring"`, and the whole process is titled for WHO SMART Guidelines. Moving that ordering into smart-base is the owner's call.
- **Items 1–2:** the test fixtures and `ingest-ig-artifacts.ts` still NAME the DAK overlay (`dak/`, `dak-api.html`) in prose and paths. The gate grades these as mentions rather than dependencies. Turning the arm into an overlay that smart-base plugs in is a refactor, not done here.

## 2026-10-09: item 4 done, owner's choice "1" (split)
- litlfred/fhir-harness#13 (merged baeba3c): `l3-fhir-pipeline.bpmn` is generic. It starts at `StartEvent_ModelReady` ("Source model ready") and goes straight to `Task_AuthorFsh`. It has no `Task_MapL2`, no `l2-dak-authoring` binding, no WHO title and 0 DAK mentions. `l3-fhir-authoring.md` and the es .pot follow.
- litlfred/smart-base#21 (merged 32e0988): the new `smart-base/processes/content/dak-l3-ig.bpmn` goes "L2 DAK ready" → Map L2 → L3 (`l3-fhir-authoring` + `l2-dak-authoring`) → callActivity `Process_L3Fhir` → published.
- This also clears the wrong-direction binding that `check:process-bindings` was written for; its baseline was already `[]`.
**Remaining:** items 1–2, the DAK overlay naming in the fixtures and in `ingest-ig-artifacts.ts`. The SVGs are re-rendered by `render:bpmn` in the index on its next run.

## 2026-10-09: items 1–2 done, owner's choice "2" (do the refactor). Bean complete.
litlfred/fhir-harness#14 (merged e250a4a):
- **Item 1:** the four test files that still built WHO fixtures now use a fictional IG: build-ig-site, fhir-cache-seed-npm, ig-api-views and schemas/ig-chrome (acme-ig, acme-base, acme.template.root).
- **Item 2:** the CODE was already an overlay (d313). Directory, hub page, markers and placeholder are flags, and `ingest:ig:check:smart-base` in the index manifest passes `dak`, `dak-api.html`, `DAK_API_HUB_*` and `DAK_API_CONTENT`. What remained was wording, and it is gone from ingest-ig-artifacts.ts, ig-api-views.ts, the artefact-index schema (including one validation message), the loaders, the typology summary and the site template.
- **Evidence:** 285 tests pass. The exclusion gate grades 0 hits against baseline 0, and prose mentions fell from 84 to 60; the rest are measurement provenance and the skill's own refusal list.
All five Done-when items are checked.
