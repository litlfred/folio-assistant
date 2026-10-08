---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Change Size Rule'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/spec-kit/change-size.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/spec-kit/change-size.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/spec-kit/change-size.md){: .fa-edit-source data-fa-link="edit" data-src="cat-harness/skills/sdlc/spec-kit/change-size.md" data-repo="litlfred/folio-assistant" }

{% raw %}
# Change Size Rule — Threshold, Basis, and Complexity Weighting

## Origin & Decision

Originates from **github/spec-kit** and GitHub issue #754 (child 4 of 5 under #730).

**Owner ruling, 2026-10-07 (FR-009)**:
> *"The change-size rule should be a report-only advisory limit initially at ~400 lines of non-generated/non-lockfile code, weighting prose and KG documentation lower, transitioning to a blocking CI gate once calibrated against PR history."*

## The Threshold and its Basis

A threshold without a basis is received wisdom wearing a decimal point. Like the health checks under `test/health/`, this rule structurally requires its basis:

| Field | Value |
|---|---|
| **Metric** | `effective_lines` |
| **Limit** | `400` effective lines |
| **Current Enforcement Mode** | **Report-only (advisory)** — transitioning to blocking CI gate once calibrated against PR history |
| **Code Weight** | `1.0` |
| **Prose / KG Documentation Weight** | `0.25` (4x line allowance) |

### The Empirical Basis

1. **Cisco / SmartBear Code Review Study** (Cohen et al., 2006):
   - Comprehensive study of ~2,500 code reviews over 10 months.
   - **Defect-detection effectiveness falls off sharply above 200–400 changed lines**.
   - Reviewer cognitive fatigue sets in after ~60 minutes; inspecting beyond 400 lines in one session leads to superficial scanning rather than thorough verification.
2. **Google Modern Code Review Case Study** (Sadowski et al., ICSE-SEIP 2018):
   - Small changelists are the primary operational lever maintaining fast review turnaround (median <4 hours) and deep reviewer scrutiny.
   - Large reviews experience disproportionately longer review latency and significantly fewer defects detected per line changed.

## Prose & Knowledge Graph vs Code

A 600-line skill rewrite and a 600-line logic refactor impose fundamentally different cognitive adjudication loads:
- **Code**: non-linear, branching control flow, invariant preservation, state mutations, and type constraints. Higher defect density per line.
- **Prose & Knowledge Graph Documentation**: linear reading flow, descriptive context, documentation updates. Lower cognitive defect hazard per line.

Therefore, prose and knowledge-graph documentation changes are weighted at **0.25x**:
$$\text{Effective Lines} = (\text{Code Lines} \times 1.0) + (\text{Prose/KG Lines} \times 0.25)$$

Under this rule:
- 400 lines of TypeScript = 400 effective lines (reaches threshold).
- 1,600 lines of documentation/skills = 400 effective lines (reaches threshold).

## "Large" vs "Hard to Adjudicate"

A change can be large in lines while being trivial to adjudicate, or small in lines while being dense and risky. The size rule distinguishes uniform mechanical changes from high-cognitive changes.

### Exempted Categories (Zero Effective Lines)

1. **Lockfiles**: `bun.lock`, `package-lock.json`, `yarn.lock`. Large machine-generated dependency trees.
2. **Generated Artefacts**: `*.jsonld`, `*.doc.json`, `*.qa.json`, `*.script-qa.json`, `_site/`, `dist/`. Build and pipeline products whose source is audited elsewhere.
3. **Uniform Mechanical Changes**: Automated renames, bulk import path migrations, or file relocations that preserve logic, provided they carry a **recorded justification** in the PR description.

## Splitting Strategy (Sub-Issues)

When a proposed change exceeds 400 effective lines:
1. Decompose the work into independent increments.
2. Open child issues linked to the governing parent issue.
3. Each child issue produces **one PR** representing one independently reviewable, independently revertible increment.
4. If a PR cannot be split, it MUST record its justification in the PR description.

## Reporting Format (SC-005)

Per **SC-005**, compliance metrics must always be reported as a **count with its denominator**, never as a bare percentage:
- Correct: *"4 of 32 PRs (12.5%) exceeded the advisory threshold."*
- Incorrect: *"12.5% of PRs exceeded the threshold."*
{% endraw %}
