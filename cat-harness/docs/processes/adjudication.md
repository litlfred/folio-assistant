---
title: 'Adjudication'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/adjudication.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Adjudication

`Process_Adjudication` · advisory · 6 step(s)

A criterion's reviewer entries disagree and no mechanism can settle them: this is the judgement that does, and the record it must leave. You are in this process when a sidecar holds two entries for ONE criterion that do not agree — a script failing what a reviewer passed, an agent and a person reading the same block differently. That is the entry condition and it is computable, which is why the first gateway leaves rather than guessing: one reviewer and no checker is a review, one checker and no reviewer is a gate, and neither is adjudicable. Nobody enters this process by declaring that they have entered it. Three things the diagram holds that prose kept losing. The adjudicator is DISPATCHED rather than briefed — given the findings and the checker's output and, deliberately, never the artefact, because an adjudicator shown the artefact can talk itself into any reading of the finding and that failure raises no error. The adjudication LEADS the criterion and the checker's entry is KEPT beneath it, because a disagreement between a checker and a reviewer is information and a sidecar showing only the winner has lost it. And the dispensation is scoped to the version it was granted against by its `field_hash`, so it lapses when the source moves and never becomes precedent. The three outcomes are the ones `review-narrative` and `voice-review` already use: the finding stands, the criterion does not apply here, or it applies and this is a stated exception. All three converge on the same write, because what makes an outcome legitimate is not which one it is but that its reason was recorded.

<img src="../assets/img/workflows/adjudication.svg" alt="BPMN diagram: Adjudication" style="max-width:100%">

## How it connects

- **Called by:** [Content Change and Review](content-change-review.html), [Ingestion subprocess — the L1 completeness gate](ingest-l1-completeness-gate.html), [Prose and the code it describes](narrative-code-review.html), [Refresh materialized remote content](refresh-materialized.html), [Narrative review](review-narrative.html), [Translation Workflow](translation-workflow.html), [Voice overlay review](voice-review.html), [Wireframe design review](wireframe-design-review.html)
- **Calls:** none
- **Skill:** [`adjudication`](../reference/skill-instructions/adjudication.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Feedback provider | `feedback-provider` | Drawn once for any number of providers — the owner's "Judgment of >= 1 Feedback Provider's feedback" — because the process does not change with the count and a lane per provider would say it did. A script checker, a review agent, a reader and an SME all act here, which is why the role admits person, agent and system alike. This lane knows the one thing the lane below does not: WHAT IT ACTUALLY LOOKED AT. A_StateFinding exists to move that across, and without it the adjudicator cannot tell a real disagreement from two parties reading different things — which looks identical from the sidecar and is not the same defect at all. The lane holds no gateway and reaches no end event on purpose: a provider states a finding and has no entitlement to settle it. |
| Adjudicator | `adjudicator` | Every decision and every write is here, and that concentration is the accountability: a reviewer reports, an adjudicator settles, and a process where the settling were spread across lanes would have no way to say who decided. The role admits person and agent — `refresh-materialized` already states the reason, "a human or agentic decision, never a merge rule" — and the judgement steps are drawn as plain tasks rather than user tasks so the diagram does not assert a person where an agent is legitimate. A_Dispatch is in this lane although the adjudicator is its SUBJECT rather than its performer, and that is deliberate: whoever composes the brief chooses what the adjudicator may see, so putting it anywhere else would let the composing party grade its own input. `untainted-verification` states the rule the step enforces — the adjudicator is given the checker's output and never the artefact. |

## Steps

Every one of the 6 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **State the finding and what it read**<br>`A_StateFinding` | Feedback provider | [`content-feedback`](../reference/skill-instructions/content-feedback.html) | Each provider says what it found and on what evidence. A finding that does not show what it read is an opinion, and an adjudicator cannot tell it from a finding about some other version of the block. |
| **Dispatch with adjudicator_sees — never the artefact**<br>`A_Dispatch` | Adjudicator | [`untainted-verification`](../reference/skill-instructions/untainted-verification.html) | `UntaintedDispatch` on the criterion declares what each party is given; the caller names a subject and a criterion and does not hand-assemble a brief, because the party composing a brief by hand is the producer. `untaintedPartitionDefects` reports `overlap` when the checker and the adjudicator can read the same file — one of them is then grading its own input, and the verdict measures nothing while raising no error. |
| **Judge the disagreement**<br>`A_Judge` | Adjudicator | [`adjudication`](../reference/skill-instructions/adjudication.html) | The judgement itself, and the one step nothing here can check: if a mechanism could decide it, the process would not have been entered. What IS checkable is that the outcome is one of the three below and that it carries a reason, which is what the steps after this gateway exist for. |
| **Scope the criterion so it stops applying here**<br>`A_ScopeCriterion` | Adjudicator | [`adjudication`](../reference/skill-instructions/adjudication.html) | One edit to the criterion rather than ten overrules on the blocks it should never have covered. This branch is the one an adjudicator under time pressure converts into a dispensation, and the conversion is a defect: a dispensation lapses when the source moves, so a mis-scoped criterion granted its way past comes back every time anybody touches the block. |
| **Grant a dispensation, with its reason**<br>`A_Dispensation` | Adjudicator | [`adjudication`](../reference/skill-instructions/adjudication.html) | The rule applies and this subject is a stated exception. A `kind: "human"` entry with `result: "pass"` overrides the script's `fail` for that criterion, and ONLY while its `field_hash` matches the current source — so the dispensation is scoped to the version it was granted against, lapses when the block changes, and never becomes precedent. There is nothing to overturn later; the source moving overturns it. A dispensation with no `notes` is not a dispensation. It is an override somebody applied to get to green, and nobody can review it afterwards — which is why this step is not relaxable. |
| **Write the entry that LEADS — keeping the checker's beneath it**<br>`A_RecordEntry` | Adjudicator | [`adjudication`](../reference/skill-instructions/adjudication.html) | Not relaxable, and the one step here that is not. A judgement nobody wrote down is indistinguishable from a checker that was never run, so the judgement is free and the record is not. Do not resolve the disagreement away: both entries stay, the adjudication on top under the sweep's most-recent-matching-hash rule. A disagreement between a checker and a reviewer is information, and somebody re-running the check next month needs to find that a checker read it differently rather than a clean pass. `/api/relevance/adjudicate` reached the same rule independently — `human_adjudicated` written alongside, never over, the agent's `assessed_by`. |

## Decisions

Every one of the 2 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **Are both sides present?**<br>`GW_Adjudicable` | A missing entry is not a disagreement. One reviewer and no checker is a review; one checker and no reviewer is a gate. Leaving here is the correct outcome for both, and it is why an actor cannot enter this process simply by declaring that it has. | **both sides present** → Dispatch with adjudicator_sees — never the artefact<br>**only one side** → Not adjudicable — it is a review, a gate, or a bug report |
| **Which of the three?**<br>`GW_Outcome` | The same three `review-narrative` and `voice-review` already name, and they are legitimate in the same way: what makes an outcome sound is not which one it is but that its reason was recorded. All three converge on A_RecordEntry for exactly that reason. | **the finding stands** → Write the entry that LEADS — keeping the checker's beneath it<br>**the criterion does not apply here** → Scope the criterion so it stops applying here<br>**it applies; this is an exception** → Grant a dispensation, with its reason |

{% endraw %}
