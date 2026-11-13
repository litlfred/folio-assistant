---
# folio-assistant-tgaj
$schema: bean/1.0.0
title: 'smart-base: one BPMN swimlane/actor validator in L2-bpmn/tools/, replacing four'
status: in-progress
type: task
priority: normal
tags:
    - smart-base
    - subgraphs
    - bpmn
    - github-skills
created_at: 2026-11-13T12:07:20Z
updated_at: 2026-11-13T22:15:00Z
parent: folio-assistant-95e7
---

## Why

Parent: `folio-assistant-95e7`. Four overlapping validators, none wired into CI:

| validator | checks | defect |
|---|---|---|
| `.github/skills/bpmn_author/validators/swimlane_validator.py` | laneSet present, orphan nodes, duplicate/FSH-invalid lane ids | callers are CLI-only |
| `.github/skills/bpmn_import/validators/swimlane_actor_validator.py` | lane → actor | expects `input/fsh/actors/ActorDefinition-DAK.<laneId>.fsh`; real files are `DAK.Persona.*.fsh` / `SGAuthoring.Persona.*.fsh`, so every lane fails |
| `.github/skills/bpmn_layout/validate_swimlanes.py` | lane/participant → ActorDefinition by `Instance:` id, fuzzy suggestions | no caller; stdlib `ET.parse` (no safe parser) |
| `smart-base/scripts/dak-swimlanes.ts` + `validators/dak-swimlanes.json` | declared persona ↔ lane mapping | the only one a skill cites (`l2-component-edit-review.md:54`) |

Plus `bpmn_author/validators/bpmn_xml_validator.py` (well-formed, root element, no Camunda/Zeebe namespaces, duplicate ids). The actions glob `input/business-processes/*.bpmn`, which does not exist (WHO main: `input/bpmn/`; this fork: `smart-base/**/processes/`). The same wrong path is in `input/scripts/bpmn_extractor.py:63`, `svg_extractor.py:65` and the scripts README.

## Done when

- [x] One tool node `L2-bpmn/tools/<id>/<id>.ts` covering structure, vendor namespaces and lane → ActorDefinition (matched by instance id, never by guessed file name), reading BPMN from the declared process directories.
- [x] `scripts/dak-swimlanes.ts` and `validators/dak-swimlanes.json` folded in or moved beside it; `l2-component-edit-review.md` cites the tool.
- [x] The three Python validators and `bpmn_author/` deleted; `bpmn_layout/bpmn_to_svg.py` either moved as an L2-bpmn tool or deleted after checking overlap with cat-harness-tools' process renderer.
- [x] The `input/business-processes` path fixed in `input/scripts/`.
- [x] The tool runs in PR CI on changed `.bpmn` files.

## Progress

- PR open and queued for Merge Manager (`ready-to-merge` + `merge-guard: success`): https://github.com/litlfred/smart-base/pull/386 (`86a857b604c8a0325f07fee61e593203be6bdeeb`, merged with `main` `8ae44b240b`; `smart-base/L2-bpmn/tools/bpmn-validate/`, `smart-base/L2-bpmn/tools/bpmn-graphviz-layout/`, `.github/workflows/bpmn-validate.yml`, and `input/bpmn/` path fixes, coordinated with `#385`).
- Duplicate PR https://github.com/litlfred/smart-base/pull/391 closed and `ready-to-merge` removed in favor of `#386` so the Merge Manager queue has no conflict.
