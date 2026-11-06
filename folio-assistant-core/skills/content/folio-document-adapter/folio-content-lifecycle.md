---
name: folio-content-lifecycle
description: >-
  The content-folio half of the harness's content-lifecycle skills
  (content-author, content-feedback, content-plan, content-publish,
  content-review, content-test, content-validate, evidence-appraisal): binds
  core lifecycle diagrams, quality-control and review-comments gates, and
  empirical vs. formal evidence rules.
---

# Folio content lifecycle and evidence appraisal

The harness package `skills/authoring/content-lifecycle/`
([`content-plan`](../../../../cat-harness/skills/authoring/content-lifecycle/content-plan.md),
[`content-author`](../../../../cat-harness/skills/authoring/content-lifecycle/content-author.md),
[`content-validate`](../../../../cat-harness/skills/authoring/content-lifecycle/content-validate.md),
[`content-review`](../../../../cat-harness/skills/authoring/content-lifecycle/content-review.md),
[`content-test`](../../../../cat-harness/skills/authoring/content-lifecycle/content-test.md),
[`content-publish`](../../../../cat-harness/skills/authoring/content-lifecycle/content-publish.md),
[`content-feedback`](../../../../cat-harness/skills/authoring/content-lifecycle/content-feedback.md),
[`content-retire`](../../../../cat-harness/skills/authoring/content-lifecycle/content-retire.md),
and [`evidence-appraisal`](../../../../cat-harness/skills/authoring/content-lifecycle/evidence-appraisal.md))
defines the generic lifecycle stages. In a content folio, apply these
core-layer bindings and refinements alongside them.

Processes:
- [`processes/content/content-lifecycle.bpmn`](../../../processes/content/content-lifecycle.bpmn)
- [`processes/content/evidence-retrieval.bpmn`](../../../processes/content/evidence-retrieval.bpmn)

## 1. Validation, quality control, and review gates

- **Validation and QC (`content-validate` → `quality-control`):** after schema
  and profile validation, aggregate block and KG QA witnesses through
  [`quality-control`](../content-lifecycle-ext/quality-control.md) to evaluate
  publication quality gates. Domain layers stacked on core add their own
  validators (for example Lean proof compilation in the sci layer, or
  SUSHI / IG Publisher / terminology validation in the FHIR and DAK layers).
- **Review and comment resolution (`content-review`, `content-feedback`):**
  track reviewer observations and phase-gate sign-offs through
  [`review-comments`](../content-lifecycle-ext/review-comments.md) and commit
  accepted edits under
  [`corpus-commit-contract`](../content-lifecycle-ext/corpus-commit-contract.md).
- **Publication (`content-publish`):** document folios publish via
  [`document-publishing`](document-publishing.md);
  higher layers add their own target artifacts (such as PDF/arXiv in the sci
  layer or `publication-request.json` and IG bundles in the FHIR layer).

## 2. Evidence appraisal in content folios (`evidence-appraisal`)

- **Declared grading system:** `Task_AppraiseGrade` in
  `processes/content/evidence-retrieval.bpmn` grades a body of evidence assembled
  for one PICO question against the grading system the folio declares (for a
  WHO guideline folio, the DAK layer's `grade` skill supplies the certainty
  levels, rating reasons, and EtD criteria).
- **Empirical grades never discharge formal proofs:** in a paper folio, a
  formal claim (`theorem`, `lemma`, `proposition`) is discharged solely by its
  formal proof sibling; empirical certainty grading applies only to guidance
  and empirical recommendations.
