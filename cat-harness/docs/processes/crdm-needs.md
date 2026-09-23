---
title: 'CRDM Phase 1 — needs'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/crdm-needs.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# CRDM Phase 1 — needs

`Process_CRDM_Needs` · strict (defaulted) · 4 step(s)

Identify the stakeholders, synthesise a needs statement from the sources, and loop until the BA and the stakeholders both recognise it. The loop is the phase: a needs statement nobody confirmed is an agent's summary, not a requirement.

<img src="../assets/img/workflows/crdm-needs.svg" alt="BPMN diagram: CRDM Phase 1 — needs" style="max-width:100%">

## How it connects

- **Called by:** [CRDM requirements](crdm-requirements.html)
- **Calls:** none

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| BA / Feature Requestor | — | The single review here is what GW_Needs is literally named for — "BA approves?" — even though Lane_Stakeholders' confirmation sits between this task and that gateway in the flow; the phase's own documentation makes clear the loop needs both, so reading the gate label alone would miss half of what it takes to exit it. |
| Agent | — | Drafts the needs statement but never decides it is right — A_Synthesise is the sole target when GW_Needs loops back — and this process's own documentation calls an unconfirmed synthesis "an agent's summary, not a requirement," which is exactly what this lane alone produces before the two lanes below it look at it. |
| Stakeholders | — | The task itself carries no documentation of its own, so this lane's entry is the only place recording what "confirm" means in Phase 1: recognising the synthesised needs statement as actually theirs, immediately before the loop gate — not, as in the later data-model phase, judging a cardinality, because there is no model yet to have one. |

## Steps

**2** of 4 step(s) carry no documentation — `activity-documented` lists them.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Phase 1: Identify stakeholders**<br>`A_Stakeholders` | Agent | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | The agent asks the BA who is affected by this change. The BA knows the domain — the agent does not guess. |
| **Phase 1: Synthesise needs from sources**<br>`A_Synthesise` | Agent | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | — |
| **Review synthesised needs statement**<br>`BA_ReviewNeeds` | BA / Feature Requestor | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | The BA reviews what the agent synthesised and checks it against what they actually need. |
| **Confirm needs statement**<br>`S_ConfirmNeeds` | Stakeholders | — | — |

{% endraw %}
