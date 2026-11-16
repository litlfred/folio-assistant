---
$schema: folio-methodology/v1
name: blueprint-driven-formalization
title: Blueprint-driven formalization — Lean as the single source of dependency and status, the blueprint node as the unit of work
origin: >
  Thomas Zhu, Pietro Monticone, Jeremy Avigad and Sean Welleck, "LeanArchitect:
  Automating Blueprint Generation for Humans and AI" (arXiv:2601.22554v1
  [cs.LO], Carnegie Mellon University and University of Trento, 30 January
  2026). Open access.

  The blueprint itself is older and is not this paper's: it is Patrick
  Massot's `leanblueprint` (2020), a plasTeX plugin whose `\uses`, `\lean` and
  `\leanok` macros this paper builds on (its §2, ref. [16]). `leanblueprint` is
  NOT ingested here, so everything this node says about it is SECOND-HAND,
  through the LeanArchitect paper.

  The LeanArchitect paper is a TOOL paper: it presents a method through one Lean
  package. What is adopted below is the method; §"Where this rendering stops"
  says which parts were left behind.
evidence:
  - library/arxiv-2601.22554v1
applies-when: >
  **A formalization is large enough that its state has to be tracked node by
  node** — many interdependent definitions and theorems, several contributors
  or agents, and partial progress that someone must be able to read at a
  glance. Use it to decide where dependency and completion status are RECORDED
  and who may write them, and to decompose a target into units an automated
  prover can attempt one at a time.

  Do NOT use it to decide whether a Lean statement says what the prose says:
  a blueprint records that a node is `sorry`-free, never that it is faithful.
  That question belongs to the equivalence and vacuity audits, and this method
  makes it MORE pressing, not less (see §4). Not for a single-theorem
  formalization, where the graph has one node and the bookkeeping costs more
  than it saves.
---

# Blueprint-driven formalization

A **blueprint** is a dependency graph over the definitions and theorems of a
formalization target, each node carrying informal text (statement, proof
sketch), the Lean declaration(s) that formalise it, the nodes it uses, and
whether its statement and its proof are formalised. The paper's claim is not
about the blueprint — that exists — but about **who writes each field**.

## 1 — The inversion: Lean is authoritative for every formalised node

The paper's core design principle (§3.1): *"minimize duplication between LaTeX
and Lean, by treating Lean as the authoritative source of information for any
formalized blueprint node."*

| field | hand-maintained blueprint | this method |
|---|---|---|
| which Lean declaration a node is (`\lean`) | written in LaTeX | written ONCE, on the declaration |
| what a node uses (`\uses`) | written in LaTeX | **inferred** from the constants the declaration's type and value mention |
| whether statement / proof is done (`\leanok`) | written in LaTeX | **inferred**: absent iff `sorryAx` is among the inferred dependencies |
| already in Mathlib (`\mathlibok`) | written in LaTeX | **inferred** from the defining module's namespace |
| informal statement and proof text | written in LaTeX | written beside the declaration, exported to LaTeX |
| the ORDER and grouping of the exposition | written in LaTeX | **still written in LaTeX** — the one thing left to a person |

**The rule to take:** a fact the formal side can compute is never also written
by hand. A hand-written copy of a computable fact is a second answer free to
disagree with the first, and the paper's §4.2 is the measurement of what that
costs (below).

Two precisions the paper makes and a reader should keep (§A.2):

- **Statement and proof carry separate dependencies.** Statement uses are the
  constants in the declaration's *type* (and, for a definition, its value);
  proof uses are those in the *value*. This is the same split as this
  platform's type and value edges — see `lean-formal-graph`.
- **Status is LOCAL, not transitive.** `\leanok` on a proof means *this*
  proof term contains no `sorry`; a proof that only uses a lemma which itself
  rests on `sorry` still gets `\leanok`. The paper chooses this deliberately:
  it *"denote[s] a completed proof formalization pending on an earlier
  unformalized lemma."* A dashboard that reads the local mark as "this theorem
  is proved" is wrong whenever an ancestor is open. The transitive question is
  a graph query, and must be asked as one.

## 2 — The blueprint node is the unit of work

The paper's workflow (§3.5) is: a mathematician writes the exposition; Lean
experts translate each node, **leaving `sorry` where the proof is not yet
done**; the blueprint then shows the frontier; the `sorry`s are filled node by
node, with status updating itself.

Its case study (§4.3) runs the same loop with automation in the prover's seat:
a planner model drafts a decomposition as a Lean file of `sorry`-proved
lemmas, a prover attempts every `sorry` node, the planner refines the
decomposition where the prover failed, and a person proves what is left. The
two properties the authors draw from it:

- **Failure is localised.** Attention goes to the few nodes still open, not to
  an all-or-nothing attempt on the target.
- **Partial success is kept.** A proved intermediate lemma is reusable whatever
  happens to the target.

## 3 — What the paper MEASURED, and what it did not

**These are the paper's findings, reported as such.** None is a mathematical
claim and none was reproduced here.

- **Converting five existing projects** (Carleson, Brownian Motion, Infinity
  Cosmos, FLT, PrimeNumberTheoremAnd; §4.2) surfaced discrepancies in their
  hand-maintained blueprints: an isolated node that was never used, a missing
  dependency edge, Mathlib results not marked `\mathlibok`, and one project
  marking status on statements only. That is evidence for §1's rule of the
  anecdotal kind: it shows the defect class exists in real projects, and it
  gives no rate.
- **One adoption** (PrimeNumberTheoremAnd, §4.1): about one day of conversion,
  with a maintainer's favourable public comment.
- **One autoformalization case study** (multivariate Taylor's theorem in
  integral form, §4.3): the prover closed all but three nodes after one
  refinement, and a person finished them. **One target, no baseline, no
  repetition** — it demonstrates that the loop can work, and measures nothing
  about how often it does.
- **The limitation the authors state themselves** (§4.3): asking the planner to
  "refine" did not reliably fix the underlying cause of a failure, because the
  prover's only feedback was *which* nodes remained. They name richer signals —
  counterexamples, missing-lemma suggestions, structured failure traces — as
  needed and not built.

## 4 — The two signals worth more than the bookkeeping

**A proof that does not use its neighbours is a statement to re-read.** The
paper reports (§4.1) that a lemma in PrimeNumberTheoremAnd was syntactically
correct and *semantically* wrong, and that the symptom was visible in the
inferred graph: its machine-generated proof depended on none of the lemmas
around it. The reasoning generalises, and it is worth stating as logic rather
than as the paper's anecdote: if a node was meant to follow from its planned
predecessors and its proof uses none of them, then either the plan was wrong
or the statement is not the one that was planned — **a proof that is easier
than the mathematics it was meant to capture is evidence about the statement,
not about the prover.** It is not proof of a defect; it is a reason to look.

**A hypothesis error surfaces as a cluster of stuck nodes.** In §4.3 the
remaining failures traced to one systematic mistake: `deriv` used where
`derivWithin` was needed for a function differentiable only on a closed
interval, which made intermediate lemmas *false as stated*. Correcting the
statements made them true and provable. When several unproved nodes share a
hypothesis shape, suspect the shape before the prover.

## Where this checkout already is, and where it differs

`methodology-adoption` §"Extract the PROCESS, not the paper's tools" requires
the comparison before any tool is proposed. Read from the skills, not assumed:

| the method asks for | this checkout has | gap |
|---|---|---|
| formal dependencies computed, never hand-written | `lean-formal-graph` derives them from `lean.ref` (Lean Atlas elaborated, or a syntactic scan) | **none in principle**; the scan fallback under-reports, as that skill says |
| blueprint `\uses` / `\leanok` in sync with Lean | `lean-generation` §"Blueprint Synchronization" makes it the **author's responsibility**, checked only by `checkdecls` for declaration existence | **the real gap** — this is the hand-sync §1 replaces |
| status local AND transitive, told apart | `proof-status-tracking` records per-block status | the local/transitive distinction is not named there |
| stuck nodes read for a shared cause | `proof-triage`, `proof-gap-audit` work the `sorry` backlog | no "shared hypothesis shape" heuristic |

## THE CONFLICT, and it must not be resolved by copying

**Blueprint `\uses` is not this platform's `uses[]`.** In LeanArchitect,
`\uses` is inferred from Lean — it is the FORMAL relation. Here, a block's
`uses[]` is the EDITORIAL relation — what a reader must have read — and
`AGENTS.md` and `lean-formalization` both forbid populating it from Lean,
because doing so destroys the signal every ordering metric is computed from.

So adopting §1 here means: the formal graph (`lean-formal-graph`) is the
inferred one, and a generated blueprint's `\uses` is filled from **that** graph.
It never means writing inferred edges into `uses[]`. Anyone implementing a
LeanArchitect-style export against this platform must read the two relations
as different graphs, which is what they are.

## Where this rendering stops

- **LeanArchitect is not adopted as a dependency.** Its `@[blueprint]`
  attribute, Lake facet and `\inputleannode` macro are one implementation of
  §1. Whether this platform should require it, or derive the same fields from
  the formal graph it already builds, is an open choice — see the bean that
  carried this ingestion.
- **The planner and prover systems of §4.3 are not adopted.** Which model
  drafts and which system proves are engineering, and one case study does not
  rank them.
- **No performance claim rests on this node.** §3 is the whole of what the
  paper measured.
- **Authoring LaTeX inside `.lean` files** is recorded, not recommended: the
  paper lists it first among its own limitations (§5), for want of editor
  support.
