---
# folio-assistant-l1nl
$schema: bean/1.0.0
title: 'IG/DAK version-numbering rule and source-of-truth rule (from #222)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T12:41:00Z
updated_at: 2026-10-30T13:35:00Z
parent: folio-assistant-uhkv
---

Leftovers of litlfred/folio-assistant#222 ("current state IG publisher pipeline"), which the owner closed on 2026-10-30 (decision card, option A). Phase 1 is documented (fhir-harness `ig-build-pipeline.md`, smart-base pre/post-processing skills) and the phase II beans (a9tx, w8rv) are completed. Two rules were asked for and never written:

1. **Version numbering.** A SEMVER rule for IG and DAK versions: what bumps major, minor and patch, and how an IG's version relates to its DAK's.
2. **Source of truth.** Which artefact is authoritative and which is rendered output, so nobody edits a rendered file and loses the change.

## Done when

- [x] Both rules are written in the skill that governs IG builds (fhir-harness or smart-base, whichever owns the pipeline), each with its basis (`litlfred/fhir-harness#199`, `litlfred/smart-base#216`).
- [x] #222 is linked from the skill change (`litlfred/fhir-harness#199`, `litlfred/smart-base#216`).

## 2026-10-30 — PRs opened

- **`litlfred/fhir-harness#199`** (`fix/l1nl-ig-version-and-source-rules`, commit `16d1a82`):
  - Adds `## Source of truth versus compiled, cached and rendered output` and `## Version numbering: SEMVER for a FHIR IG` to `skills/fhir-ig-base/ig-build-pipeline.md`, and cross-references both from `skills/content/fhir-ig-authoring/ig-publication.md` (`versionIncrement` input), linking `litlfred/folio-assistant#222`.
  - Maps every authoritative input declared in `contentTypes.ig.include` (`schemas/ig-content-type.ts`, bean `cz17`) to its compiled/cached/rendered outputs (`fsh-generated/`, `output/`, `output-ast/` and `cat/fhir-harness/fhir-ast/<package id>`, `fhir-artifact-index/`, `ast-data/`, `artifact/`, and `gh-pages`), and specifies what triggers `major`, `minor` and `patch` bumps measured over the AST surface (`ig-ast.ts diff`), plus release vs development status/pinning rules (bean `dhvf`, `check:published-refs`).
  - Keeps `fhir-harness` strictly free of WHO/DAK references (`check:fhir-harness-exclusions`: 0 graded hits).
- **`litlfred/smart-base#216`** (`fix/l1nl-dak-version-and-source-rules`, commit `d5a9748`):
  - Adds `## Source of truth versus generated artefacts in a DAK repository` and `## Version numbering: DAK SEMVER and how an IG's version relates to its DAK's` to `smart-base/skills/content/authoring-who-smart-guidelines/dak-preprocessing.md`, linking `litlfred/folio-assistant#222`.
  - Documents the cross-layer authority chain (`L1 → L2 → L3 → compiled AST / rendered site`) and the DAK pre/post-processing source-of-truth table (`dak_index.py`, `generate_dak_from_sushi.py`, `update_sushi_config.py`, `dmn_questionnaire_generator.py`, `transform_dmn.py`, `inject_translations.py`, `qa-checkers-dak.ts` `isGeneratedArtefact`, and `ig-site-sidecars.ts`).
  - Defines DAK `major`/`minor`/`patch` triggers across the nine L2 DAK component types (`DAK.fsh` / `DakDeclarationSchema`) and the IG↔DAK version relationship across co-hosted DAK+IG repositories (lockstep `MAJOR.MINOR.PATCH` and `status`, requiring simultaneous updates to `sushi-config.yaml` and `index.config.json` `contentTypes.dak` because `generate_dak_from_sushi.py` skips existing `contentTypes.dak` sections), standalone L2 DAK vs downstream L3 IG repositories, and adapted/country DAKs/IGs.
