---
# folio-assistant-aqb6
title: 'PIPELINE INVENTORY: the 13 DAK pre/post-processing steps, each assigned to a layer and written into the skill that owns it'
status: in-progress
type: feature
priority: high
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-22T19:23:57Z
parent: folio-assistant-uhkv
---

Assign every step of the WHO build to exactly one layer, and write each into
the skill that owns its phase.

**This is the falsification test for the stack**, not documentation for its own
sake: if a step cannot be placed, or two siblings both need it, the sibling
split is wrong.

## Read, not inferred

`WorldHealthOrganization/smart-base` — `.github/workflows/ghbuild.yml` and
`input/scripts/` — on 2026-09-22 at that repository's `main`.

| phase | invocations |
|---|---|
| pre-process DAK | 6 across 4 workflow steps |
| render IG | 1 (`publisher.jar`, in Docker) |
| post-process DAK | 9 across 6 workflow steps |
| deploy | 6 |

## What the assignment found

- **Step 2 of pre-processing is the phase's whole reason.**
  `update_sushi_config.py` registers `dak-api.md` in `sushi-config.yaml`'s
  `pages:` map and `Indices → DAK API` in its `menu:`, and writes a placeholder
  markdown page per ValueSet and logical model. The "IG index" is those two
  maps. We own both under just-the-docs, so the step does not survive.
- **Two pre-processing steps are not pre-processing.** The DMN questionnaire
  generator and the DMN transform MINT ARTEFACTS. They belong upstream of the
  Publisher as authoring.
- **Two post-processing steps are not WHO's.** The Library strippers → `fhir-harness`.
- **One step is the transition's seam.** `generate_smart_liquid.py` already
  computes IG metadata → Liquid variables.

## Done when
- [x] the inventory read from source, with provenance
- [x] `dak-preprocessing` and `dak-postprocessing` written
- [x] `ig-publication` gains the render-IG phase
- [x] each step assigned; none unplaceable
- [ ] the deploy phase's 6 steps assigned — NOT yet done, and the split is
      unverified until they are
