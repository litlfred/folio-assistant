---
layout: default
title: 'Content Authoring'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/content-lifecycle/content-author.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/content-lifecycle/content-author.md) — do not edit here. Typed contract: [schema reference](../skills/content-author.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/content-lifecycle/content-author.md){: .fa-edit-source }

{% raw %}
# Content Authoring

Create and develop content artifacts according to the project plan.

## Responsibilities
- Translate source material into structured digital artifacts
- Create business process diagrams (BPMN 2.0)
- Author data dictionaries and core data elements
- Develop decision-support logic
- Create user scenarios and personas
- Author functional and non-functional requirements
- Define indicators and measures
- **Verify authored content against the repo's own CI before opening a PR** —
  dispatch the relevant workflow on your branch and record the result (see
  below)

## Don't hand off on a workflow nobody ran

Authoring is not finished at "it builds here". Before the PR, push and
dispatch the repo's verification workflow against your branch
(`gh workflow run <wf>.yml --ref <branch>`, or `actions_run_trigger`), wait
for it, and put the **run URL and conclusion** in the PR body. Red → fix and
re-dispatch. If you lack `actions: write`, state that in the PR along with the
command a maintainer should run.

Check when that workflow **last ran**, too. A repo can carry a CI file that
has not executed in months: qou's `lean_ci.yml` last ran 2026-04-25 and
failed, and in the interval 37 Lean modules stopped compiling — some with
parse errors, meaning they had never compiled. Nothing caught it because
nothing ran.

## Actors
- Business Analyst (L2 authoring lead)
- FHIR Modeller (L3 authoring lead)
- Terminologist (terminology governance)
- Clinical SME (clinical validation)

## Inputs
- Project plan
- Source guidelines/recommendations
- Existing content (if iterating)

## Outputs
- Authored content artifacts
- Draft versions ready for validation
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Authoring a paper](../../processes/authoring-a-paper.html) | 4 · Author blocks |
| [Content Change and Review](../../processes/content-change-review.html) | Edit narrative content blocks; Edit deterministic logic (if needed); Iterate on author feedback |
| [Content lifecycle](../../processes/content-lifecycle.html) | Editing and HCI validation (calls a sub-process) |
| [Draft, review and publish](../../processes/draft-to-publication.html) | Editing and HCI validation (calls a sub-process) |
| [Editing and HCI validation](../../processes/editing-hci-validation.html) | Draft the block edit; Revise the proposed change |
| [Evidence for a recommendation](../../processes/evidence-retrieval.html) | Frame the question as PICO; Attach the evidence to the recommendation |

