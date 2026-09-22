---
layout: default
title: 'quality-control'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring-who-smart-guidelines/quality-control.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring-who-smart-guidelines/quality-control.md) — do not edit here. Typed contract: [schema reference](../skills/quality-control.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring-who-smart-guidelines/quality-control.md){: .fa-edit-source }

{% raw %}
# quality-control

> Skill id: `quality-control` · Package: `authoring-who-smart-guidelines` ·
> Named by `l3-fhir-pipeline.bpmn` (**QC gates**, `QC reviewer` lane),
> `ig-incremental-build.bpmn` (**QC gates on the aggregate QA**, `PR reviewer /
> QC reviewer` lane) and `content-change-review.bpmn` (**Run publication QA
> gates**, `Corpus + build pipeline` lane).

Apply the publication quality gates to an aggregate of QA output, and decide
whether it clears.

## Inputs and outputs

`schemas/skills/quality-control/`:

- **in** — `checkType` (required), `targetPath` (required), `checklistSections`
- **out** — `overallResult`, `findings`, `checklistResults`

## Two of the three lanes are human, and that is the design

A QC gate is a **decision**, and the processes put it in a reviewer's lane —
`QC reviewer`, `PR reviewer / QC reviewer` — not the build's. The build's lane
runs the checks; the reviewer's lane rules on them.

The `qc-reviewer` role holds `qa-reporting` as a permission, and `qa-reporting`
is also held by `ci-pipeline` and `ig-publisher-service`. That a build system
and a human share a permission is deliberate: **emitting** a QA report is
mechanical, **ruling** on it is not.

`editing-hci-validation.bpmn` marks `Task_ReviewFindings` and
`Gateway_EditorDecision` `relaxable="false"` for exactly this reason. The
editor seeing the findings, and the decision itself, are the gate; a policy
that relaxed them would leave "strict base" meaning nothing.

## Compute the gate, do not assert it

Where a gateway carries `<folio:decision/>`, pass the **facts** — e.g.
`{ failCritical: 0, failMajor: 2 }` from `qa_sweep` totals — and let the DMN
table return the branch. `workflow_complete` refuses a hand-supplied `outcome`
at such a gateway.

This is what stops "QC passed" from being an opinion. `draft-qa-gate.dmn` is
the table; `dmn-authoring` is how to change it.

## Severity is the gate's vocabulary

The corpus-wide convention, and what the tables read:

- **critical** — a broken reference: something names a thing that does not
  exist, and a consumer following it gets nothing. Blocks.
- **major** — a missing join: intact, but a question has no answer.
- **minor** — coverage. Has legitimate instances, so it must not gate; forcing
  a fake entry onto a real step is worse than the gap.

**`unknown` is never counted as a pass**, and it is not promoted either — it
counts at its own criterion's severity. A check that did not run has not
cleared, and a QC gate is the last place that should be blurred.

## What to run

`qa_sweep` for content, `bun run kg:audit` for the process/role/skill graph,
`fhir-validation` for FHIR conformance. `checklistSections` narrows the pass;
`findings` and `checklistResults` are what the reviewer reads — not
`overallResult` alone, which is a summary of them rather than a substitute.
{% endraw %}
