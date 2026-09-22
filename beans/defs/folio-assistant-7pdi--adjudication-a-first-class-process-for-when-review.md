---
# folio-assistant-7pdi
title: 'ADJUDICATION: a first-class process for when review reaches no mechanical/consensus agreement — and the narrative-vs-code axis it most often needs it for'
status: todo
type: task
priority: normal
created_at: 2026-09-21T23:27:42Z
updated_at: 2026-09-22T05:48:03Z
parent: folio-assistant-1swy
---


Owner, 2026-09-21 (session_017PqeiS4JYySSWGAYLedmus), queued as an aside —
verbatim, because the ask ties five things together and a paraphrase would
drop one:

> aside, find bean on code review: need to see if semantic/narrative assertion
> matches code written. similar skills for lean already. generalize process,
> and provde high levels skills + specific lean things in own subgraph.
> probably also specialzed lean detangler skills that could be applied (check
> lit) to make proofs shorter. need adjuducation if code and narrative
> disagree. need high level adjudication process, if it does not exist, during
> review process a concensus/mechanical agreemenet was not reached, in this
> case Judgment is needed and Adjudication process being. similar/closely
> realted to public reivew/feedback process. it is Judgment of >= 1 Feedback
> Provider's feedback. still have same dispensation process (reason for choice
> as per contextual requirements). fill in gaps in processes/skills. ties
> together skills ...and procesesses

## What already exists — measured 2026-09-21, before proposing anything

The ask opens with *"find bean on code review"*, so the landscape was read
first. **More exists than the ask assumes, and the gap is narrower and sharper
than "build an adjudication process".**

### Review is already a dispatcher with typed subprocesses

| process | file |
|---|---|
| generic dispatch | `skills/workflows/review-task.bpmn` |
| code | `review-code.bpmn`, `code-change-review.bpmn` |
| narrative | `review-narrative.bpmn` |
| content | `content-change-review.bpmn` |
| voice | `voice-review.bpmn` |
| theme/UI | `theme-ui-review.bpmn` |

The `reviewer` role's own description already states the pattern: *"The
GENERIC review position: what kind of thing changed decides which subprocess it
descends into (`review-task.bpmn`), and the actor takes on that inner lane's
role for the call path only."* So **generalising the process is not the gap** —
the dispatcher is built.

### Four of the roles the ask needs are declared

`code-reviewer`, `narrative-reviewer`, `qc-reviewer`, `translation-adjudicator`,
plus `proof-review-agent`, `lean-authoring-agent` and `lean-toolchain`.
`translation-adjudicator` is the only ADJUDICATOR, and it is scoped to one
domain — it is also (measured) one of the roles no diagram draws, binding a
lane *"Human reviewer / adjudicator"* that no diagram contains.

### `adjudicat*` appears in EIGHT diagrams and in no skill

`voice-review`, `code-change-review`, `refresh-materialized`,
`ingest-l1-completeness-gate`, `evidence-retrieval`, `ingest-extract-structure`,
`review-narrative`, `translation-workflow`. **Eight processes reach for
adjudication and there is no adjudication skill, no adjudication process, and
no `adjudicator` role.** Each diagram says the word and then does its own
thing. That is the actual gap the ask names, and it is worse than "missing" —
it is eight private answers to one question.

### `dispensation` exists in exactly ONE place

`skills/folio-paper-adapter/q-usage-watcher.md`. The ask says the adjudication
outcome carries *"the same dispensation process (reason for choice as per
contextual requirements)"* — so dispensation has to be lifted out of a paper
watcher and made a shape any adjudication produces. It is a rule with no home,
which is the failure `AGENTS.md`'s own banner describes.

### `Feedback Provider` is not a declared role at all

Zero matches across the repository. The ask defines adjudication as *"Judgment
of >= 1 Feedback Provider's feedback"*, so the object being judged has no type
and its author has no role. The public-review/feedback side the ask says this
is *"similar/closely realted to"* is the `todo-review` skill (a domain feature,
the content-review feedback workflow) — which `AGENTS.md` is explicit is NOT
the agent work plan. Whether they unify is the first real question.

### The narrative-vs-code axis exists for Lean and NOWHERE ELSE

`proof-narrative-lean-equiv` — bean `nrv8` records that the sweep never ran.
`qusg` records `q-usage`'s narrative-chapter-mismatch flag. Both are
paper-adapter, both are Lean/prose. `code-node-review.md` is the nearest
general skill and it asks a DIFFERENT question — *"is this a correct NODE"*
(does it declare what it is, do its references resolve, is the advertised
mechanism the one that runs) rather than *"does the prose assert what the code
does"*. So the ask's first sentence is correct: the axis is Lean-only, and
generalising it is genuinely new.

## The shape this suggests — to be roasted, not built

1. **`adjudication` as a process and a skill**, entered when a review reaches
   no mechanical or consensus agreement. Its INPUT is ≥ 1 Feedback Provider's
   feedback; its OUTPUT is a judgement plus a **dispensation** — the reason
   for the choice against the contextual requirements. The eight diagrams
   already reaching for it call it instead of re-inventing it.
2. **`adjudicator` and `feedback-provider` as declared roles**, so the lane
   binding is real rather than eight prose mentions.
3. **A `narrative-asserts-code` review axis, general**, with the Lean
   specifics in their own subgraph — the ask's *"high level skills + specific
   lean things in own subgraph"*. The general question is "does the prose
   assert what the artefact does"; the Lean one adds a proof assistant that
   can answer mechanically, which most artefacts cannot.
4. **Lean detangler skills** — CHECK THE LITERATURE FIRST. The ask says
   *"(check lit)"* and it is load-bearing: proof minimisation, premise
   selection and tactic-level simplification are active research areas, and
   `graph-detanglement.bpmn` plus `kg:detangle` already exist here for a
   different subject. Whether either transfers is a reading task, not a
   design one. Issue #198 already tracks the Lean tooling roadmap (Lean
   Atlas / Compass, Nazrin, refactor cluster, LeanDojo) — start there.

## Open questions for the roast

- **Does adjudication unify with `todo-review`'s feedback workflow, or sit
  beside it?** The ask says "similar/closely related", not "the same". One
  process with a domain parameter, or two that share the dispensation shape?
- **Is `translation-adjudicator` a specialisation of a new generic
  `adjudicator`, or does it stay separate?** It is the only adjudicator role
  today and it binds a lane no diagram draws, so it can be moved cheaply now
  and not later.
- **What makes agreement "mechanical" versus "consensus"?** The ask
  distinguishes them and the difference decides when adjudication is ENTERED.
  A gate's verdict is mechanical; two reviewers agreeing is consensus; a
  proof assistant closing a goal is mechanical about a semantic claim, which
  is the interesting case.
- **Does a dispensation bind future reviews?** A recorded reason nobody can
  cite is a comment; one that binds is precedent, and precedent needs a place
  to live and a way to be overturned.

## Done when

- [ ] The roast above is held and its answers recorded here — nothing built
      first
- [ ] `adjudication` exists as a BPMN process with a skill, entered from
      `review-task.bpmn` when no mechanical or consensus agreement is reached
- [ ] `adjudicator` and `feedback-provider` are declared roles with lanes
- [ ] `dispensation` is lifted out of `q-usage-watcher.md` into a shape any
      adjudication produces
- [ ] A general `narrative-asserts-code` review axis exists, with the Lean
      specifics in their own subgraph rather than in the general skill
- [ ] The Lean proof-shortening literature is READ and summarised before any
      detangler skill is proposed — issue #198 is the starting point
- [ ] The eight diagrams that say `adjudicat*` call the process rather than
      each doing their own thing

Related: `nrv8` (proof-narrative-lean-equiv never ran), `qusg` (q-usage
narrative-chapter mismatch), `code-node-review` skill, `todo-review` skill,
issue #198 (Lean tooling roadmap), `sb6z` (nothing runs kg-detangle).
