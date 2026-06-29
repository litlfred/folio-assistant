---
layout: default
title: Skill schema reference
nav_order: 5
has_children: true
---

# Skill schema reference

Every folio-assistant skill declares a typed **input** and **output** contract as
JSON Schema (draft-07). These pages are generated from those schemas so the
published reference can never drift from what the framework actually validates.

| Skill | Id | Description |
|-------|----|-------------|
| [BPMN Authoring](bpmn-authoring.html) | `bpmn-authoring` | Input schema for BPMN 2.0 business process authoring. |
| [Content Author](content-author.html) | `content-author` | Input schema for general content authoring. |
| [Content Feedback](content-feedback.html) | `content-feedback` | Input schema for feedback collection and triage. |
| [Content Plan](content-plan.html) | `content-plan` | Input schema for content planning — scope, team, timeline, governance. |
| [Content Publish](content-publish.html) | `content-publish` | Input schema for content publication. |
| [Content Review](content-review.html) | `content-review` | Input schema for formal content review and approval workflow. |
| [Content Test](content-test.html) | `content-test` | Input schema for end-to-end content testing. |
| [Content Validate](content-validate.html) | `content-validate` | Input schema for content validation. |
| [DMN Authoring](dmn-authoring.html) | `dmn-authoring` | Input schema for DMN (Decision Model and Notation) decision table authoring. |
| [FHIR Validation](fhir-validation.html) | `fhir-validation` | Input schema for FHIR validation — runs SUSHI, IG Publisher QA, and conformance checks. |
| [IG Publication](ig-publication.html) | `ig-publication` | Input schema for FHIR Implementation Guide publication. |
| [L2 DAK Authoring](l2-dak-authoring.html) | `l2-dak-authoring` | Input schema for L2 Digital Adaptation Kit authoring. Translates WHO clinical guidelines into structured digital artifacts. |
| [L3 FHIR Authoring](l3-fhir-authoring.html) | `l3-fhir-authoring` | Input schema for L3 FHIR IG authoring. Creates machine-readable FHIR artifacts from L2 DAK specifications. |
| [LaTeX Authoring](latex-authoring.html) | `latex-authoring` | Input schema for the latex-authoring skill. |
| [Lean Formalization](lean-formalization.html) | `lean-formalization` | Input schema for the lean-formalization skill. Describes source material to be formalized in Lean 4. |
| [Proof Verification](proof-verification.html) | `proof-verification` | Input schema for the proof-verification skill. Verifies Lean proofs and tracks sorry obligations. |
| [Quality Control](quality-control.html) | `quality-control` | Input schema for quality control checks across content lifecycle. |
| [Terminology Management](terminology-management.html) | `terminology-management` | Input schema for terminology management — CodeSystems, ValueSets, ConceptMaps. |

See also the [TypeScript API reference](../../api/) for the content-object model
(`Block`, `Chapter`, `Paper`, builders, and runtime Zod constraints).
