---
# folio-assistant-bvuk
title: 'ONE OUTCOME GATEWAY, SIX DIFFERENT QUESTIONS: Process_Adjudication''s three codes do not fit every caller'
status: completed
type: task
priority: normal
created_at: 2026-09-23T09:19:05Z
updated_at: 2026-09-23T18:52:11Z
parent: folio-assistant-ahvw
---

Six processes call Process_Adjudication. Its GW_Outcome offers stands/scope/dispensation — QA-criterion outcomes. refresh-materialized calls it to decide which side wins a local-vs-remote conflict. Those are not the same answers. Pre-existing; #1026 made it visible by naming the codes.

## Two corrections to this bean, both from checking it before building

### It is SIX callers, not five

`wireframe-design-review.bpmn` was missed. Re-measured 2026-09-23 with
`grep -c 'calledElement="Process_Adjudication"' *.bpmn`, which reports
**per file** and so cannot silently drop one:

| caller | its call activity | the question it is really asking |
|---|---|---|
| `review-narrative` | `Task_AdjudicateVoice` | does this voice finding stand? |
| `voice-review` | `Task_Adjudicate` | "prose, scope, or exception" — its own name |
| `refresh-materialized` | `Task_Adjudicate` | **which side wins** a local-vs-remote conflict |
| `translation-workflow` | `Task_Adjudicate` | is this flagged passage acceptable? |
| `ingest-l1-completeness-gate` | `Task_FlagDrift` | is this drift real? |
| `wireframe-design-review` | `Call_Adjudicate` | do two checker entries agree? |

This bean's own §"Measured" claimed an unpaginated grep over the whole
directory — and that claim was what made the table look complete. **The same
failure as scrapped `idl1`, one round later**: `idl1` came from a `head -8`,
this from a grep whose output was transcribed by hand. Pagination was never the
mechanism; **reading a list off a screen instead of off a counter** was, both
times.

### NO CALLER BRANCHES ON THE OUTCOME — and none could

Measured 2026-09-23, `sourceRef="<call activity>"` over all six:

- **Every one of the six has exactly ONE outgoing sequence flow.** Not one
  reads the answer.
- **`Process_Adjudication` has exactly one settled end event.** Its three
  branches — `F_Stands`, `F_Scope`, `F_Exception` — all reconverge on
  `A_RecordEntry` → `End_Settled`. `End_NotAdjudicable` is the only other exit
  and it is the "only one side present" abort.

So a caller **could not** branch on the outcome even if it wanted to: the
subprocess offers one place for control to leave.

## What that does to the three candidate shapes

**It falsifies (1) as written, which was this bean's own recommendation.**
"The caller supplies the codes" assumed the codes are a *returned value* the
caller could be handed a different set of. They are not — they are **internal
work selectors**. `F_Scope` runs `A_ScopeCriterion` ("Scope the criterion so it
stops applying here") and `F_Exception` runs `A_Dispensation`. Handing
`refresh-materialized` the codes `local-wins`/`remote-wins` would leave those
two codes pointing at two QA-criterion tasks. Passing data does not repoint a
branch that performs distinct work.

The real defect is therefore **not** "callers receive three answers that do not
fit their question". It is: **four of the six enter a subprocess that may run
`A_ScopeCriterion` or `A_Dispensation` when there is no criterion to scope and
no dispensation to grant.** The mismatch is in the WORK the branches do, not in
the enum.

**That makes (2) stronger and suggests a fourth shape:**

4. **Split the diagram at the judgement.** Everything up to and including
   `A_Judge` is genuinely shared — `A_Dispatch` composing `adjudicator_sees`,
   the `person agent` restriction, `GW_Adjudicable`. Everything *after*
   `GW_Outcome` is caller-specific consequence. Keep the first half as one
   called process; let each caller own its own outcome handling. This preserves
   the exact thing (2) was criticised for losing — "the one place where
   `adjudicator_sees` and the actor restriction are stated" — because that
   place is entirely in the shared half.

(3) — widen the shared gateway — is unchanged and still the worst.

## This is PRE-EXISTING, and #1026 is what made it visible

The three branches existed before any of this. What #1026 did was **name**
them, which is the entire value of naming: a mismatch that was expressible in
prose became a claim a reader can check. The contract did not create the
problem; it stopped the problem hiding.

That is worth stating plainly because the tempting reading is the opposite —
"the new codes broke six callers". They did not. Six callers were already
routing different questions through one three-branch gateway.

## The owner picked shape (4) — split at the judgement

2026-09-23, from the four candidates below. Implemented:

- **`adjudication.bpmn` ends at `A_Adjudicate` → `End_Adjudicated`.** It keeps
  what must not vary: `GW_Adjudicable` (the entry condition nobody may declare
  their way past), `A_Dispatch` (`adjudicator_sees`, never the artefact), and
  the `person agent` restriction. `A_Adjudicate` declares
  `<folio:adjudication defers="caller"/>` — **declared, not a missing `codes`**,
  so a marker lost by accident and a deferral on purpose do not parse the same.
- **`criterion-adjudication.bpmn` is new** and owns `GW_Outcome`,
  `A_ScopeCriterion`, `A_Dispensation`, `A_RecordEntry`, `End_Settled`. Its
  `Call_Adjudicate` declares `codes="stands scope dispensation"`, which the
  engine checks against its own gateway's coded branches.
- **`review-narrative` and `voice-review` call the specialisation.** The other
  four call the shared half and **no longer reach `A_ScopeCriterion` or
  `A_Dispensation`** — pinned as reachability rather than as a name, since that
  is the defect, not the naming.

`A_RecordEntry`'s `relaxable="false"` was not dropped in the move: it travels
with the recording caller, which is the honest place for it, because the entry
written depends on what was adjudicated.

**The objection to shape (2) does not apply.** "It loses the one place where
`adjudicator_sees` and the actor restriction are stated" — those did not move
and are not restated. The one restatement is the `folio:fulfilment` on
`Call_Adjudicate`, which is required because that is where the enum is declared
and a step naming permitted answers without saying who may choose among them
has restricted nobody. It cannot drift wrong: the engine refuses `system` or
`external` on any step carrying `folio:adjudication`, so the only failure
available is absence, and absence is refused too.

**Terminology, the owner 2026-09-23: "not Judge, but Adjudicator".** `A_Judge`
is `A_Adjudicate`; the actor noun is adjudicator throughout the code, the
schemas, the messages and the tests. "Judgement" stays — it is the thing
produced, and `folio:judgement` is an established gateway marker.

## What landed first, and what is still the owner's

Shape-independent, so built without waiting:
`<folio:adjudication accepts="…"/>` on a call activity — the answers a caller
can act on, compared at load time against the judge inside the process it
calls. Set equality, not a subset: an unaccepted answer still arrives.

- **Refused** — a declared `accepts` that disagrees with its judge, or one on a
  call into a process that judges nothing.
- **Reported** — a caller that declares nothing. `check:workflow-refs` prints
  2 of 6 declared. `review-narrative` and `voice-review` are declared because
  `adjudication.bpmn`'s own documentation already asserts they fit ("The three
  outcomes are the ones `review-narrative` and `voice-review` already use") —
  a prose claim nothing compared to anything until now. The other four are
  **left undeclared on purpose**: guessing an `accepts` for them would turn
  this open decision into a checked-looking assertion.

It survives every shape above. Under (2) or (4) the callers point at different
processes and declare their own; under (3) the declaration is what makes the
widening visible.

Also fixed in passing: `<folio:adjudication/>` had no unknown-attribute guard,
so with three attributes across two positions a typo read as abstention — the
`folio:bean action="create"` failure, one element over. The guard is now
**per position** (`codes`/`accepts` on a node, `code` on a flow), because a
union guard would have let `code` sit ignored on a judge.

## Done when

- [x] Owner picks a shape — **(4), split at the judgement**, 2026-09-23. (1)
      was off the table: the codes selected TASKS, not a returned value.
- [x] Each caller's permitted answers are the ones its own question admits.
      **All ten, 2026-09-23.** Three are the owner's own design with real
      branches (#1156, another session): refresh-materialized
      `remote local merge defer`, translation-workflow `accept edit retranslate`,
      ingest-l1-completeness-gate `real spurious source-wrong`. The rest came
      from this session's proposals, approved as a set (#1155):
      content-change-review `stands withdrawn`; wireframe-design-review
      re-pointed to `Process_CriterionAdjudication`; document-ingestion
      `accepts` the L1 gate's three. `check:workflow-refs`: "10 of 10 say which
      answers they can act on".
- [x] A caller whose codes differ from the shared gateway's is REFUSED rather
      than silently routed through the wrong three — `checkAcceptedCodes` in
      `process-model.ts`, with absence reported rather than guessed.
- [x] `bun run gates` green — locally every gate but the two that fail only because of the git-ignored `.claude/worktrees/`; CI must be green before the PR merges.

## Summary of Changes

Shape (4) landed first (split at the judgement; `accepts` checked at load). Every caller now names the answers ITS question admits.

| caller | answers | from |
|---|---|---|
| refresh-materialized | `remote` · `local` · `merge` · `defer` | #1156 — owner's design, each answer its own branch |
| translation-workflow | `accept` · `edit` · `retranslate` | #1156 — new Task_EditTranslation |
| ingest-l1-completeness-gate | `real` · `spurious` · `source-wrong` | #1156 — reasons recorded against the verdict |
| content-change-review | `stands` · `withdrawn` | #1155 — recorded on the comment; no branch |
| wireframe-design-review | `stands` · `scope` · `dispensation` | #1155 — re-pointed to Process_CriterionAdjudication |
| document-ingestion | `accepts` the L1 gate's three | #1155 — its call into the gate, which now contains a judgement |

#1155 first proposed two-answer sets for the three #1156 callers; #1156 merged first with the owner's own design, so #1155 took main's side for those diagrams when bringing main in. `adjudication-marker.test.ts` pins every shared-half caller's own codes.
