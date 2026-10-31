---
name: uses-formal-comparison
description: >-
  How a paper folio's formal dependency graph (from Lean) relates to the
  editorial `uses[]` relation the harness's uses-editorial-review audits:
  why they diverge, why `uses[]` is never populated from Lean, and how to
  read the advisory `uses-formal-coverage` finding.
---

# `uses[]` against the formal graph

The harness skill `uses-editorial-review` audits `uses[]`, the editorial
relation: what a reader must have read first. It says that a content type with
a formal layer derives a second relation, and that the layer shipping the
content type holds the comparison. This is that comparison for a paper folio,
whose formal layer is Lean. It lived in `uses-editorial-review` until
2026-10-24 and moved here under bean `syiq` (the owner's ruling Q2 of
2026-10-01: `uses[]` stays in the harness, the Lean comparison goes to sci).

## Two relations, diverging correctly

`uses[]` is **not** the formal dependency graph. What a proof actually
invokes is machine-derived from `lean.ref` (see
`pipeline/content-graph.ts`). The two relations are different
questions and they diverge in both directions, correctly:

| Situation | Formal edge | Editorial edge | Correct? |
|---|---|---|---|
| Proof calls a `simp` lemma / typeclass instance | yes | no | **yes** — nobody reads about it |
| Theorem motivated by an example it never cites | no | yes | **yes** — the reader needs the motivation |
| Definition the statement is phrased in terms of | yes | yes | yes |
| Library lemma pasted into `uses[]` from Lean | yes | yes | **no** — pollution, see below |

## Never populate `uses[]` from the Lean graph

The harness rule is general: never populate `uses[]` from a machine-derived
graph. For a paper folio that graph is the Lean dependency graph. When you
review, do not open the Lean file to decide what belongs in `uses[]`; the
question is about the reader, not the proof term. A `simp` lemma, an instance,
or a library lemma the prose never mentions that appears in `uses[]` is the
pollution case, and it fails (major).

## The advisory finding `uses-formal-coverage`

| Mechanical finding | What it means for your review |
|---|---|
| `uses-formal-coverage` **warn** — formal-only targets | **Advisory.** A list of blocks the proof leans on that the narrative never introduces. Read each one and ask whether the narrative owes the reader an introduction. Most will not — that is the expected answer. Never bulk-apply these to `uses[]`. |

`uses-formal-coverage` is the one place formal structure informs this
review, and it informs it as a *question*, never an instruction. It
returns `n/a` when the Lean Atlas cache is absent; an empty formal edge
set means the data was unavailable, not that the block is clean.

### When an exposition gap is real

If `uses-formal-coverage` surfaces a formal dependency and, reading the
narrative, you agree a reader is left stranded — the fix is usually
**prose, not a `uses[]` entry**: introduce the object, or cite the
result inline. Add to `uses[]` only when the reader genuinely must go
read that other block first. Record the reasoning in the sidecar
`notes` either way, so the next reviewer does not re-litigate it.

## Skills here that consume the editorial relation

| Skill | Interaction |
|---|---|
| `detangler-integration-watcher` | Consumes the editorial relation for ordering metrics — a polluted `uses[]` corrupts its output |
| `proof-gap-audit` | An exposition gap here often coincides with an inter-proof gap there |
| `proof-simplifier` | Extracts shared lemmas; new blocks need `uses[]` entries authored, not derived |
