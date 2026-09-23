---
title: 'Ingestion subprocess — the L1 completeness gate'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/ingest-l1-completeness-gate.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Ingestion subprocess — the L1 completeness gate

`Process_L1Gate` · advisory · 4 step(s)

folio-assistant — Ingestion subprocess — the L1 completeness gate. Source of truth: this file. Open it in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool. The SVG under docs/assets/img/workflows/ is generated from it by `bun run render:bpmn` — never hand-edit the SVG. The <folio:skill> extension on an activity names the folio-assistant skill that implements it; <folio:bean> marks a step that reads or writes the shared work plan in beans/.

<img src="../assets/img/workflows/ingest-l1-completeness-gate.svg" alt="BPMN diagram: Ingestion subprocess — the L1 completeness gate" style="max-width:100%">

## How it connects

- **Called by:** [Document ingestion — uploads/ to the L1 source knowledge graph](document-ingestion.html)
- **Calls:** [Adjudication](adjudication.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Ingestion Engine (agent, runs unattended) | — | Runs both QA checks unattended and hands off exactly where the role's persona says it must: Gateway_Drift's 'drift' branch leaves this lane the moment a passage needs a judgement about which of two readings is right, rather than guessing — but Task_Verdict, which records the outcome either way, stays in this lane, so Lane_1 adjudicates a single passage while this lane still owns the completeness verdict as a whole. |
| Reviewer (SME or editor) | — | The only human involvement anywhere in this subprocess: Lane_0 runs both checks and records the verdict unattended, so this lane exists solely for the single case machine QA cannot resolve on its own — a flagged passage where round-trip translation produced two different readings and somebody has to say which is right. |

## Steps

Every one of the 4 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Is every derived artefact present?**<br>`Task_CheckDerived` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | L1 source to L1 KG is NOT complete while a required derived artefact is missing. This is the gate that makes the derivation steps obligatory rather than aspirational. |
| **Round-trip translation QA**<br>`Task_RoundTrip` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | NOT IMPLEMENTED. Tracked as a bean; see docs/document-ingestion.md. Back-translate each localized narrative into its source language and compare meaning, to catch semantic drift and bad terminology that a forward-only check cannot see. |
| **Adjudicate the flagged passage**<br>`Task_FlagDrift` | Reviewer (SME or editor) | calls [Adjudication](adjudication.html)<br>[`document-intake`](../reference/skill-instructions/document-intake.html)<br>[`adjudication`](../reference/skill-instructions/adjudication.html) | A machine can detect that two readings differ. Which one is right is a human call. |
| **Record the L1 completeness verdict**<br>`Task_Verdict` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | Record the completeness verdict in three states — met, unmet, or not yet derivable — as bun run check:l1-complete reports it. Not-yet-derivable is never a pass. An unmet verdict opens a bean and returns to derivation; only a met one lets the entry into library/. |

## Decisions

Every one of the 2 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **Drift or bad terminology?**<br>`Gateway_Drift` | Answered by the round-trip translation QA: did it flag semantic drift or a terminology miss? `drift` sends the passage to a person to adjudicate, since which reading is right is a human call; `clean` records the verdict directly. | **drift** → Adjudicate the flagged passage<br>**clean** → Record the L1 completeness verdict |
| **Which reading was right?**<br>`GW_DriftOutcome` | All three converge on Task_Verdict, and that is deliberate rather than the codes being decoration: this lane adjudicates ONE passage while Lane_0 still owns the completeness verdict as a whole, so the outcome of a passage is a REASON recorded against that verdict, never a different next step. The same shape criterion-adjudication uses, where three outcomes converge on one write because what makes an outcome legitimate is that its reason was recorded. What differs is what gets written and what it obliges. `real` is drift to fix in the translation. `spurious` is a false positive, and recording it is what stops the same passage being re-flagged every run. `source-wrong` points at the SOURCE rather than the translation — the one answer that sends work out of this process entirely, because no amount of re-translating a wrong source produces a right target. | **the drift is real** → Record the L1 completeness verdict<br>**false positive** → Record the L1 completeness verdict<br>**the SOURCE is wrong** → Record the L1 completeness verdict |

{% endraw %}
