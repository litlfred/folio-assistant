---
layout: default
title: 'Content Review'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/content-lifecycle/content-review.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/content-lifecycle/content-review.md) — do not edit here. Typed contract: [schema reference](../skills/content-review.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/content-lifecycle/content-review.md){: .fa-edit-source }

{% raw %}
# Content Review

Formal review and approval of validated content before publication.

## Responsibilities
- Review L2 content before L3 begins (phase gate)
- Review L3 content before publication (phase gate)
- Assess breaking vs. non-breaking changes
- Ensure alignment with source guidelines
- Approve draft publications for stakeholder circulation
- Provide final publication release sign-off

## Actors
- Content Reviewer (lead, approval authority)
- Technical Officer (first-pass review)
- Clinical SME (clinical sign-off)
- Programme Manager (governance oversight)

## Inputs
- Validated content artifacts
- Validation reports
- Change log / diff from previous version

## Outputs
Findings and a decision — two things, not one. See
[`decision-audit`](../folio-core/decision-audit.md) and
[`schemas/qa-review.ts`](../../schemas/qa-review.ts).

- **Findings** — one per observation, each carrying the axis this reviewer can
  speak on: `blocking | suggestion | praise` for a person, `critical | major |
  minor` for a checker. Neither defaults into the other, and `praise` has no
  machine equivalent.
- **A decision** — `approve | request-changes | reject`, naming every finding it
  weighed and every one it overruled. An overruled finding stays on the record.
- **Audit notes** — why this outcome, and why each overruled finding was left.
  At least one per decision, each citing corpus evidence. Approving over an open
  `critical` or `blocking` finding without overruling it is a reported problem.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Authoring a document](../../processes/authoring-a-document.html) | 8 · Review and feedback |
| [Authoring a paper](../../processes/authoring-a-paper.html) | 8 · Review and feedback |
| [Content Change and Review](../../processes/content-change-review.html) | Review impact assessment; Request changes |
| [Content lifecycle](../../processes/content-lifecycle.html) | Editing and HCI validation (calls a sub-process); Draft, review and publish (calls a sub-process) |
| [Draft, review and publish](../../processes/draft-to-publication.html) | Circulate the draft; Review the draft publication; Clinical / scientific sign-off |
| [Editing and HCI validation](../../processes/editing-hci-validation.html) | Agent review of the change; Human / SME review |
| [Evidence for a recommendation](../../processes/evidence-retrieval.html) | Review the guidance already in this content |
| [L2 DAK authoring](../../processes/l2-dak-authoring.html) | Clinical validation |
| [Narrative review](../../processes/review-narrative.html) | Read the sidecar findings |
| [Review task](../../processes/review-task.html) | Consolidate findings |

