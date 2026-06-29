---
layout: default
title: Content Validation
parent: Skill instructions
---

{: .note }
> Generated from [`skills/content-lifecycle/content-validate.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/content-lifecycle/content-validate.md) — do not edit here. Typed contract: [schema reference](../skills/content-validate.html).

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
