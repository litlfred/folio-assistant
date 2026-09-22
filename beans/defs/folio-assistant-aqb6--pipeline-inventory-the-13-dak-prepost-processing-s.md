---
# folio-assistant-aqb6
title: 'PIPELINE INVENTORY: the 13 DAK pre/post-processing steps, each assigned to a layer and written into the skill that owns it'
status: completed
type: feature
priority: high
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-22T21:29:40Z
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
- [x] the deploy phase's 10 steps assigned — DONE 2026-09-22. Nine to
      `fhir-harness` and one (the PR-comment step) to `cat-harness`. The
      count was wrong here too: the phase is ten steps, not six.
      **The phase came back entirely generic**, which was not the expected
      answer and is the strongest evidence for `nsbb`'s base-plus-overlay
      claim — the overlay never reaches the deployment end

## Summary of Changes

All 26 steps of the WHO build are assigned, and the split survived its own
test: none needed a sixth layer, none needed two owners. Three placed against
their own step names — both `Library` strippers to `fhir-harness`, and the
PR-comment step to `cat-harness`, which owns forge plumbing.

Written into the skills that own each phase: `dak-preprocessing` (6
invocations), `ig-publication` §render-IG (1), `dak-postprocessing` (9),
`ig-build-pipeline` §"The deploy phase" (10).

On `main` in `95e63c12`.
