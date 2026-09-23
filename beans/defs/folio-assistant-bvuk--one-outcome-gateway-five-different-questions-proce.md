---
# folio-assistant-bvuk
title: 'ONE OUTCOME GATEWAY, FIVE DIFFERENT QUESTIONS: Process_Adjudication''s three codes do not fit every caller'
status: todo
parent: folio-assistant-ahvw
type: task
created_at: 2026-09-23T09:19:05Z
updated_at: 2026-09-23T09:19:05Z
---

Five processes call Process_Adjudication. Its GW_Outcome offers stands/scope/dispensation — QA-criterion outcomes. refresh-materialized calls it to decide which side wins a local-vs-remote conflict. Those are not the same answers. Pre-existing; #1026 made it visible by naming the codes.

## The five callers, and what each actually asks

Measured 2026-09-23 — `grep -rn 'calledElement="Process_Adjudication"'` over
the whole directory, **unpaginated**, which is the correction that produced
this bean (see scrapped `idl1`).

| caller | its call activity | the question it is really asking |
|---|---|---|
| `review-narrative` | `Task_AdjudicateVoice` | does this voice finding stand? |
| `voice-review` | `Task_Adjudicate` | "prose, scope, or exception" — its own name |
| `refresh-materialized` | `Task_Adjudicate` | **which side wins** a local-vs-remote conflict |
| `translation-workflow` | `Task_Adjudicate` | is this flagged passage acceptable? |
| `ingest-l1-completeness-gate` | `Task_FlagDrift` | is this drift real? |

`Process_Adjudication`'s `GW_Outcome` offers exactly three branches, now coded
`stands` / `scope` / `dispensation`. Two of the five fit that well
(`review-narrative`, `voice-review` — the diagram's own documentation says so:
*"The three outcomes are the ones `review-narrative` and `voice-review` already
use"*).

**`refresh-materialized` does not.** Its documentation: *"A human or agentic
decision, never a merge rule. Which side wins depends on why the local edit was
made."* "Which side wins" is not answered by "the criterion does not apply
here". A `callActivity` runs the whole sub-process including its gateway, so
that caller currently routes a conflict decision through three QA-criterion
outcomes.

## This is PRE-EXISTING, and #1026 is what made it visible

The three branches existed before any of this. What #1026 did was **name**
them, which is the entire value of naming: a mismatch that was expressible in
prose became a claim a reader can check. The contract did not create the
problem; it stopped the problem hiding.

That is worth stating plainly because the tempting reading is the opposite —
"the new codes broke five callers". They did not. Five callers were already
routing different questions through one three-branch gateway.

## The shape of a fix — NOT decided here

Three candidates, and the choice is the owner's because it changes what five
processes execute:

1. **The caller supplies the codes.** The judgement contract already has the
   mechanism — `folio-assistant-core/schemas/adjudication.ts` takes `codes` as
   data precisely so the enum is per-request. A `callActivity` would pass its
   own set. This is the shape the contract was built for.
2. **Separate processes per question kind**, sharing the skill rather than the
   diagram. Honest, but multiplies diagrams and loses the one place where
   `adjudicator_sees` and the actor restriction are stated.
3. **Widen the shared gateway** to a superset. Cheapest and worst — the enum
   stops meaning anything and every caller gets answers it cannot act on.

(1) is the obvious candidate given the contract already models it, but the
BPMN half does not yet read codes from a `callActivity`, so it is real work
rather than a rename.

## Done when

- [ ] Owner picks a shape, with the reason recorded.
- [ ] Each caller's permitted answers are the ones its own question admits.
- [ ] A caller whose codes differ from the shared gateway's is REFUSED rather
      than silently routed through the wrong three — the same posture the
      marker already takes for a partly-coded gateway.
- [ ] `bun run gates` green.
