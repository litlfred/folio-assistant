---
layout: default
title: 'Content Validation'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/content-lifecycle/content-validate.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/content-lifecycle/content-validate.md) — do not edit here. Typed contract: [schema reference](../skills/content-validate.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/content-lifecycle/content-validate.md){: .fa-edit-source }

{% raw %}
# Content Validation

Validate authored content against schemas, standards, and clinical accuracy.

## Responsibilities
- Run schema validation against defined constraints
- Validate FHIR resources (if applicable)
- Run SUSHI compilation (if applicable)
- Execute IG Publisher QA checks (if applicable)
- Verify Lean proofs compile (if applicable)
- Check cross-component consistency
- Validate terminology bindings

## Actors
- QC Reviewer (lead)
- FHIR Modeller (technical validation)
- Terminologist (terminology validation)
- Clinical SME (clinical accuracy)

## Inputs
- Authored content artifacts
- Validation rules and schemas
- Reference standards

## Outputs
- Validation report (pass/fail per artifact)
- Issue list with severity and remediation guidance
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Authoring a document](../../processes/authoring-a-document.html) | 5 · Check the profile; 6 · Validate |
| [Authoring a paper](../../processes/authoring-a-paper.html) | 6 · Validate |
| [Content lifecycle](../../processes/content-lifecycle.html) | Editing and HCI validation (calls a sub-process) |
| [Draft, review and publish](../../processes/draft-to-publication.html) | Editing and HCI validation (calls a sub-process) |
| [Editing and HCI validation](../../processes/editing-hci-validation.html) | Schema and constraint checks; Syntax, spelling and links; Collate findings into a report |
| [L2 DAK authoring](../../processes/l2-dak-authoring.html) | Assemble and validate the DAK |
| [Review task](../../processes/review-task.html) | Accept, or send back |

