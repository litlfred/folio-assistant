---
# folio-assistant-7pdi
title: 'ADJUDICATION: a first-class process for when review reaches no mechanical/consensus agreement — and the narrative-vs-code axis it most often needs it for'
status: todo
type: task
priority: normal
created_at: 2026-09-21T23:27:42Z
updated_at: 2026-09-22T08:48:05Z
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

## ROAST HELD 2026-09-22 — all four questions answerable from the corpus

And **two claims in the section above are wrong**, both in the direction of
overstating the gap. Corrected in place below rather than deleted, because the
next agent reading the original would otherwise re-derive them.

### Correction 1: FOUR diagrams adjudicate, not eight

`adjudicat*` appears in eight diagrams. Reading each rather than counting the
matches: **four carry an adjudication ACTIVITY** — `refresh-materialized`
("Adjudicate the conflict"), `review-narrative` ("Adjudicate the voice
findings"), `voice-review` ("Adjudicate: prose, scope, or exception"),
`translation-workflow` (`Task_Adjudicate`, plus sign-off). The other four use
the word in prose about something else: *"already-adjudicated guidance"*,
*"never adjudicated verdicts"*, *"needs a judgement"*.

Eight private answers to one question was the claim. Four is still the gap;
eight was a grep.

### Correction 2: dispensation is NOT a rule with no home

The WORD appears once, in `q-usage-watcher.md`. **The MECHANISM is
schema-backed and general**: `schemas/block-qa.ts` declares three reviewer
kinds — `script`, `agent`, `human` — allows **multiple entries per criterion**,
and says in its own header *"script + agent + human adjudication"*, with
`human` glossed as *"the repo owner (or a human collaborator) adjudicated."*

`q-usage-watcher` documents ONE APPLICATION of that primitive, and says so:
*"The `block-qa/v1` schema's multi-reviewer mechanism is the dispensation
primitive."* So dispensation has a home, it is typed, and it is used by voice
review and narrative review as well.

### The shape is already implemented THREE times, identically

| diagram | skill | the decision |
|---|---|---|
| `refresh-materialized` | `materialize-remote` | *"A human or agentic decision, never a merge rule. Which side wins depends on why the local edit was made, and a process that picked automatically would be choosing without the one fact that decides it."* |
| `review-narrative` | `voice-editorial-review` | *"Three outcomes, all legitimate: the register is wrong for this genre; the criterion does not belong in this genre; or the block is a stated exception and a reviewer entry records why."* |
| `voice-review` | `voice-overlay-review` | *"The same three outcomes … fix the prose; scope it on the voice; or the rule applies and this block is an exception (a reviewer entry records why)."* |

One shape in all three: **checkers produce candidates, a judgement is needed
because the mechanism lacks the deciding fact, and the outcome carries a
recorded reason.** That is the owner's ask, already built. What is missing is
that it is NAMED nowhere — no skill, no role, no process to call — so the
fourth implementation will be a fourth private answer.

### Q — mechanical vs consensus: THE SCHEMA ANSWERS IT

`block-qa/v1`'s reviewer kinds give it directly:

- **mechanical agreement** — the `script` entry passes.
- **consensus** — entries of different kinds agree on one criterion.
- **adjudication is entered when entries for one criterion DISAGREE**, which
  is computable from the sidecar rather than declared by a person.

And `voice-review.bpmn` states the resolution rule: *"The adjudication LEADS
the criterion and the script entry is kept beneath it: **a disagreement
between a checker and a reviewer is information**."* Both kept, verdict on
top — which is also the answer to the owner's *"need adjudication if code and
narrative disagree"*: do not resolve the disagreement away, record it.

### Q — does a dispensation bind future reviews? NO, and deliberately

Stronger than the framing above. A human entry only overrides the script's
fail *"as long as the human entry's `field_hash` matches the current source
files"*, under the sweep's "most-recent matching-hash entry wins" rule.
`q-usage-watcher`: *"Re-grant after any change to the .md / .ts."*

So a dispensation is scoped to a **version**, never precedent. A term the
bean reached for — "precedent needs a place to live and a way to be
overturned" — does not apply: the source changing overturns it.

### Q — unify with `todo-review`, or sit beside it? BESIDE

Three stores already exist and each answers a different question:

| store | holds | skill |
|---|---|---|
| `todos/feedback/` | a person's feedback ON content — the INTAKE | `todo-review` |
| `test/results/block-qa/` | reviewer entries per criterion — the RECORD | `qa-*` |
| `beans/` | the agent work plan | `todo-manager` |

Adjudication CONSUMES an intake and WRITES a record. It is the step between
them, not a rival to either. `todo-review`'s own disambiguation block already
separates itself from `todo-manager` and is silent about verdicts — that
silence is the seam.

### Q — is `translation-adjudicator` a specialisation? YES, and the lane is REAL

The bean said it binds a lane no diagram contains. **That was a false finding
from my own blind regex** — see below. `Lane_Reviewer` in
`translation-workflow.bpmn` is named *"Human reviewer / adjudicator"* and
holds two activities; it was invisible because that one diagram writes
`<lane>` with no `bpmn:` prefix.

It is now documented, and its documentation states the general shape: *"a
reviewer reports, an adjudicator settles … somebody has to choose between them
WITH a reason. That reason is the record, not the choice."*

## The roast found a live defect in a shipped gate

`translation-workflow.bpmn` declares BPMN as the DEFAULT namespace — valid,
and every prefixed regex in this repository missed it. Measured:

| | |
|---|---|
| `loadProcessModel` (bpmn-moddle) saw | 3 lanes, 15 nodes |
| every regex reader saw | **0** |
| `check:lane-documentation` reported | *"157 of 157 documented, 0 undocumented"* |
| the corpus actually holds | **159** task-containing lanes, **2 undocumented** |

A clean run over a set it never scanned — `dh4f` — **inside the gate written
to catch exactly that**, green for two days. It also produced the glossary's
one "dangling lane binding" finding, which was false: a false finding is worse
than none, because the next agent goes looking for a lane to add.

Fixed: the lane, activity, flowNodeRef, process and documentation regexes in
`check-lane-documentation.ts` and `glossary-export.ts` are namespace-tolerant;
the two lanes are documented and re-extracted to all five locales; and
`lane-extraction-parity.test.ts` now compares the regex reader's lane count
against `loadProcessModel`'s **for every diagram**, with a second test
asserting the corpus still contains an unprefixed one so the guard cannot pass
vacuously. Reverting either regex turns it red.

## What is left for the owner, and it is ONE decision

Everything above was answerable by reading. The decision that is not:

**Mint a generic `adjudication` process + skill + `adjudicator` role, given
the shape is implemented three times and named nowhere?** The cost is a
fourth thing in a space that already has three stores and six review
subprocesses; the benefit is that the fourth implementation calls it instead
of inventing a fifth. Recommendation: yes, and `translation-adjudicator`
becomes its first specialisation, since that role's lane is now the only one
in the corpus documented in the general terms.

The **narrative-asserts-code axis** remains genuinely new — `code-node-review`
asks whether a NODE is correct (does it declare what it is, do its references
resolve), not whether the prose asserts what the artefact does. That is a
second decision and a larger one.

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
