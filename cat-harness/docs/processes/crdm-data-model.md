---
title: 'CRDM data model'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/crdm-data-model.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# CRDM data model

`Process_CRDM_DataModel` · strict · 5 step(s)

Draft the data model from the BPA and the requirements, have the BA confirm the entities and the stakeholders confirm the cardinalities, and loop until both. A requirement the model cannot express is a finding, not a modelling failure: it means the requirement is about something nobody has named.

<img src="../assets/img/workflows/crdm-data-model.svg" alt="BPMN diagram: CRDM data model" style="max-width:100%">

## How it connects

- **Called by:** [CRDM requirements](crdm-requirements.html)
- **Calls:** none
- **Presented on:** no docs page section shows this diagram
- **Skill:** [`crdm-data-model`](../reference/skill-instructions/crdm-data-model.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| BA / Feature Requestor | `business-analyst` | Confirms naming only — are these the entities meant — and stops there: Lane_Stakeholders asks the separate, operational question about cardinality next, and the two are kept apart on purpose, because collapsing them into one review is how a wrong cardinality ships invisibly. |
| Agent | `authoring-agent` | Does the actual modelling — entities, relations, and the declaration that makes the model machine-readable rather than prose — and absorbs the entire cost of a revise: the gate loops back to A_Entities whichever confirmation failed, BA's or the stakeholders', so this lane cannot assume a cardinality objection leaves its entities untouched. |
| Stakeholders | `stakeholder` | Answers the operational half the BA cannot — not what a thing is but how many of it there really is — because that is knowable only to the people who run the process day to day. It is also the step this process's STRICT policy exists for: skipped under time pressure, a model looks finished without it, which is exactly how a hole where the exceptions live would ship unnoticed. |

## Steps

Every one of the 5 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Identify entities from the BPA and requirements**<br>`A_Entities` | Agent | [`crdm-data-model`](../reference/skill-instructions/crdm-data-model.html) | Every verb in the BPA whose object is a candidate entity, and every noun in a requirement. An entity with no identifier is an attribute of something else — that test is decisive and belongs to the technique skill. |
| **Relations and cardinalities, both ways**<br>`A_Relations` | Agent | [`crdm-data-model`](../reference/skill-instructions/crdm-data-model.html) | Stated in both directions, because "one attestation per report" and "one report per attestation" are different claims and a model with only the first cannot say whether a re-signature is an update or a second row. |
| **Confirm the entities are the ones meant**<br>`BA_ConfirmEntities` | BA / Feature Requestor | [`crdm-data-model`](../reference/skill-instructions/crdm-data-model.html) | A naming question. The BA owns the domain vocabulary; the agent does not guess, which is CRDM's own rule for phase 1 and applies here with more force. |
| **Confirm the cardinalities**<br>`S_ConfirmCardinality` | Stakeholders | [`crdm-data-model`](../reference/skill-instructions/crdm-data-model.html) | An operational question, asked of the people who run the process because they know where the exceptions are. |
| **Declare the model where a tool can read it**<br>`A_Declare` | Agent | [`crdm-data-model`](../reference/skill-instructions/crdm-data-model.html) | A model in prose is a proposal; a model in the declaration is a model. Ship a reader in the same change — everything here that was only documentation went inert within weeks. |

## Decisions

Every one of the 1 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **Entities recognised and every cardinality answered?**<br>`GW_Model` | Answered by the BA after confirming cardinalities: are the entities recognised and every cardinality answered? `revise` returns to identifying entities; `yes` declares the model where a tool can read it. | **revise** → Identify entities from the BPA and requirements<br>**yes** → Declare the model where a tool can read it |

{% endraw %}
