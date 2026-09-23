# AGENTS.md — smart-dak

The **L2** layer: Digital Adaptation Kit components — personas, business
processes, decision logic, data elements — and the authoring transforms over
them. This is the harness every `smart-*` DAK instantiates.

## The one question for this layer

> **Is it derived from the guideline and consumed by the IG?**

A DMN decision table is. The recommendation it came from is `smart-l1`; the
`PlanDefinition` compiled from it is `smart-ig`.

## The tools question this layer does NOT answer

`smart-base/tools/` holds nine Tool nodes for the DAK pre/post pipeline —
`dmn-to-questionnaire`, `dmn-to-html`, `dak-config-from-sushi` and the DAK API
surface generators. Several are L2-shaped by the placement question.

They are **not** moved here. The instruction that put them there was explicit
— *"the skill/tools under smart-base should consolidate under the
`smart-base/tools/` directory under this repo"* — and was given before this
directory existed. Overriding a direct instruction with an inference is not a
tidy-up; issue [#975](https://github.com/litlfred/folio-assistant/issues/975)
records the question for a ruling.

**Do not move them because this file mentions them.** Noticing a thing is not
authorisation to act on it.

## It declares no directories

Per the `folio-assistant-core` precedent: declaring a directory that is not
there is the `dh4f` defect.

Placement:
[`smart-stack-layering`](../cat-harness/skills/authoring-who-smart-guidelines/smart-stack-layering.md).
The pipeline steps:
[`dak-preprocessing`](../cat-harness/skills/authoring-who-smart-guidelines/dak-preprocessing.md),
[`dak-postprocessing`](../cat-harness/skills/authoring-who-smart-guidelines/dak-postprocessing.md).
