---
# folio-assistant-5vo9
title: 'ADJUDICATION AS A TYPED SUBPROCESS: one judgement contract, reusable in every BPMN'
status: todo
parent: folio-assistant-ahvw
type: feature
created_at: 2026-09-23T06:15:42Z
updated_at: 2026-09-23T06:15:42Z
---

Formalize 'use judgement' as a declared subprocess with a typed I/O contract, so a non-deterministic step is marked as one rather than left implicit. Owner's spec 2026-09-23. A CONCRETE INSTANCE ALREADY EXISTS (processes/adjudication.bpmn) — this generalises it rather than starting over.

## The owner's specification, 2026-09-23, verbatim in substance

> need formalized adjudication process so there is "use judgement". Skill given
> input = {set of content assets, question/prompt (markdown), list of judgement
> codes}, make a judgement, output = {decision-code (dependent on context),
> reasoning = markdown}. IO is materialized or by reference. then formalize this
> as sub-process in all existing BPMN. ONLY agentic/human actor. indicated
> non-deterministic task/subprocess.

And, in two follow-ups: *"should be in folio-asst-core"*, *"adjudication related
things happen in folio-asst-core, maybe need to migrate/split out from
cat-harness?"*

## FIRST: this is a generalisation, not a new thing

**`cat-harness/processes/adjudication.bpmn` already exists** — 289 lines, two
lanes (`Feedback provider`, `Adjudicator`), and the shape the owner describes
is already in it once:

`A_StateFinding` → `GW_Adjudicable` ("Are both sides present?") →
`A_Dispatch` ("Dispatch with `adjudicator_sees` — never the artefact") →
`A_Judge` → `GW_Outcome` ("Which of the three?") →
`A_ScopeCriterion` | `A_Dispensation` → `A_RecordEntry`.

Map it onto the spec and the correspondence is close enough that starting from
a blank file would be a mistake:

| the spec | what `adjudication.bpmn` already has |
|---|---|
| set of content assets | `adjudicator_sees` — and notably a RESTRICTED set, never the artefact |
| question/prompt | the finding, stated by `A_StateFinding` |
| list of judgement codes | `GW_Outcome`, "which of the three?" — an enum, hard-coded in one diagram |
| decision-code out | the branch taken |
| reasoning out | `A_RecordEntry` |
| only agentic/human | two lanes, both human/agentic roles |

**So the work is to lift the contract out of this one diagram and make it
declarable**, then re-express this diagram as an instance of it. That also
means the generalisation has a test from day one: it must be able to express
the adjudication that already exists, unchanged in behaviour.

`adjudication.bpmn` belongs to the UNTAINTED VERIFICATION epic
(`folio-assistant-3x2n`), and `adjudicator_sees` is that epic's contribution:
the judge is given a restricted view ON PURPOSE. **Any general contract must
keep the ability to restrict the input set, not merely to pass one.** A
contract that always hands over everything would silently undo it.

## What is genuinely new in the spec

1. **A declared, typed I/O contract** rather than a shape re-drawn per diagram.
2. **`list of judgement codes` as data.** Today the outcomes are gateway names
   in one file. As a declared enum they become validatable: a returned code
   either is or is not in the list, which is the cheapest possible deterministic
   safeguard around a non-deterministic step.
3. **`materialized or by reference`** — and this vocabulary already exists.
   `folio-assistant-core/schemas/materialization.ts` defines `referenced`
   (we know it exists and where, and hold none of it) against materialized.
   **Reuse it; do not mint a second spelling.** `library-ingestion` records
   that core owns this half deliberately.
4. **ONLY agentic/human actor** — structurally, not by convention. Actors come
   in three kinds here (human, agentic, mechanical), so the contract must
   REFUSE a mechanical actor rather than merely omit one. A judgement a script
   can perform is not a judgement; it is a `folio:decision` and belongs in a
   DMN table.
5. **Marked non-deterministic.** `folio:judgement` (with a reason) already
   marks a gateway this way and `check:workflow-refs` already counts the three
   states — computed / declared-judgement / undeclared. A subprocess-level
   marker should extend that, not start a parallel scheme.

## The methodology this now has evidence for

Ingested the same day: `library/arxiv-2508.05192v2`, rendered as
`methodologies/hybrid-llm-deterministic.md`. Its five safeguards map onto this
spec almost one-to-one, which is a reason to think the spec is well-formed:

| safeguard (source §III-A) | the spec's counterpart |
|---|---|
| 1 prompt construction owned by the tool | `question/prompt` is a declared input, not ad-hoc |
| 2 integrated validation | the returned code must be in `list of judgement codes` |
| 3 targeted context | `set of content assets` — scoped, and `adjudicator_sees` already narrows it |
| 4 post-processing | parse the code out of the response |
| 5 human-in-the-loop, raw response shown | ONLY agentic/human actor; `reasoning` is the raw record |

## The placement question — NOT decided here

The owner asked it rather than ruling on it, so it stays open.

**Measured:** `folio-assistant-core` declares four directories —
`schemas/`, `folios/`, `skills/voices/`, `tools/`. It has **no `processes/`
and no `methodologies/`**, and its `skills/` directory on disk is declared only
as far as `skills/voices/`. So "put adjudication in core" is not a file move; it
needs core to declare at least one new directory, and that is a structural
change belonging to the SPLIT epic (`folio-assistant-vke6`, #223).

Two things point different ways and both should be weighed:

- **For core** — the I/O contract needs `materialization.ts`, which core owns,
  and `library/` is core's graph. A contract in `cat-harness` depending on a
  core schema inverts the dependency.
- **For cat-harness** — the marker (`folio:judgement`), the counter
  (`check:workflow-refs`), the engine and every existing process live here, and
  `adjudication.bpmn` itself is here. Splitting the contract from its only
  enforcement is how a rule ends up with nothing checking it.

A third possibility neither message named: **the contract (schema) in core, the
BPMN and the marker in cat-harness.** That matches the layer split
`library-ingestion` already describes for ingestion — core owns the vocabulary,
cat-harness owns the machinery.

## "formalize as sub-process in ALL existing BPMN" — scope this before doing it

Taken literally this touches every diagram under `processes/`. **Count the
directory rather than trusting a number in prose** (`bpmn-processes`), and
expect most diagrams to have no judgement step at all. The honest version is:
every diagram that TODAY has an undeclared judgement point. `check:workflow-refs`
already reports that set, and `deterministic-and-agentic` calls it *"a backlog,
not a finding"* — so the backlog it already prints is the work list, and no new
survey is needed to produce one.

## Done when

- [ ] Placement decided (core / cat-harness / split), with the reason recorded.
- [ ] A declared I/O contract: content assets (materialized or referenced),
      prompt, judgement-code enum → code + reasoning.
- [ ] The contract REFUSES a mechanical actor, structurally.
- [ ] `processes/adjudication.bpmn` re-expressed as an instance of it, with
      `adjudicator_sees` still able to restrict the input set, and no
      behavioural change.
- [ ] A returned code outside the declared enum is refused, and there is a test
      proving the refusal fires.
- [ ] The non-deterministic marker extends `folio:judgement` / the
      `check:workflow-refs` three-state count rather than paralleling it.
- [ ] Applied to the diagrams `check:workflow-refs` reports as undeclared —
      that list, not "all BPMN".
