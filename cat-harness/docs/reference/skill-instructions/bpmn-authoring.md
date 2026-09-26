---
layout: default
title: 'bpmn-authoring'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/workflow/bpmn-authoring.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/workflow/bpmn-authoring.md) — do not edit here. Typed contract: [schema reference](../skills/bpmn-authoring.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/workflow/bpmn-authoring.md){: .fa-edit-source }

{% raw %}
# bpmn-authoring

> Skill id: `bpmn-authoring` · Package: `workflow` ·
> Named by `l2-dak-authoring.bpmn` (**Business processes · BPMN 2.0**,
> `Business analyst` lane) and `crdm-requirements.bpmn` (**Phase 2: Map current
> workflow (BPA)**, `Agent` lane).

Author BPMN 2.0 business process diagrams — both a DAK's L2 business processes
and this repository's own `processes/*.bpmn`.

## Inputs and outputs

`schemas/skills/bpmn-authoring/`:

- **in** — `processName` (required), `sourceWorkflow`, `existingBpmn`,
  `participants`
- **out** — `bpmnFile`, `diagramFile`, `taskCount`, `gatewayCount`,
  `participantCount`

`graphviz` is a declared capability with `degradation: skip` — layout help
degrades, authoring does not stop.

## Diagram Interchange is not optional

A `.bpmn` with no DI section — no explicit `x`/`y` on its shapes — parses and
renders **blank**. This is the single most common way a new diagram here
arrives broken, and it survives review because the XML looks complete.

`bun run render:bpmn` renders every diagram to `docs/assets/img/workflows/`
with bpmn-js in headless Chromium; `bun run render:bpmn:check` fails when an
SVG is stale. Run the renderer and look at the SVG before you call a diagram
done.

## In this repository, a diagram is executable

`processes/*.bpmn` are not pictures. `workflow_start` / `workflow_next`
/ `workflow_complete` run them, and `workflow_complete` **refuses a step that
is not enabled**. That has consequences for how you author:

- **Every activity carries `<bootstrap.processes:skill ref="…"/>`** naming the skill that
  implements it, and `<cat-harness.processes:bean store="beans/"/>` where it touches the work
  plan. `bun run check:workflow-refs` fails on a ref that resolves to nothing,
  and `bun run kg:audit` additionally fails when the named skill exists but no
  package can **serve** it.
- **Every lane is a role.** Bind it with `<bootstrap.processes:role ref="…"/>` against
  `scenarios/roles.json`. Lane names are free text and sixty of them once
  spelled two dozen positions; an explicit ref is the join that does not depend
  on spelling.
- **A gateway may be computed rather than chosen** — see `dmn-authoring`.
- **Policy is declared on the process.** `<cat-harness.processes:policy enforcement="strict"/>`
  means `workflow_gate` refuses a step that is not enabled; absent policy means
  strict. Steps marked `relaxable="false"` may never be relaxed by any package.

## If it has actors, activities and a control flow, it is BPMN

Not a Mermaid fence. Mermaid stays for the things that are *not* processes —
component maps, lattices, navigation graphs. The audit of which is which is in
`docs/publication-workflow.md`.

## Why a DAK section sits in a platform package

This skill lived in `authoring-who-smart-guidelines` until 2026-09-20, and it
never belonged there: its own first line says it covers *both* a DAK's L2
business processes **and this repository's own `processes/*.bpmn`*, five
of its six sections are content-agnostic, and `crdm-requirements.bpmn` — a
PLATFORM process — names it from the `Agent` lane. A platform process
depending on a content-type package is the boundary
the `platform-boundary-guard` subagent exists to keep — measured under bean
`ugid`, moved under `3g13`.

The section below stayed with it rather than being split out. A generic skill
naming a domain worked example is ordinary; two skills that must be read
together to author one diagram are not. If a second content type ever needs
its own section here, that is the moment to reconsider — not before.

## For a DAK

`smart-base`'s `bpmn2fsh` transform turns an authored business process into
FHIR Shorthand, so the BPMN is a **source artefact** rather than documentation
of one. Author it knowing it will be transformed: names and ids you choose here
appear in generated FSH. `smart-base-tools` has the mechanics.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [CRDM Phases 2–4 — BPA and requirements](../../processes/crdm-requirements-definition.html) | Phase 2: Map current workflow (BPA) |
| [L2 DAK authoring](../../processes/l2-dak-authoring.html) | Business processes · BPMN 2.0 |

