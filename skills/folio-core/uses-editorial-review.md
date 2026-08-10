---
name: uses-editorial-review
roles: [collaborator, owner]
description: >
  Adjudicate `uses-editorial-completeness` — read a block as a reader
  would and judge whether its `uses[]` is complete and genuinely
  expository.  The human/agent half of the `uses` QA axis; the
  mechanical half runs in `qa-checkers-uses.ts`.
allowed-tools: Read Edit Bash Grep Glob
---

# `uses[]` Editorial Review

## The relation you are auditing

`uses[]` is the **editorial** dependency relation: *what must a reader
have read to follow this block?* It is authored content — a deliberate
judgement about narrative order — and it is maintained by agents and
humans, not generated.

It is **not** the formal dependency graph. What a proof actually
invokes is machine-derived from `lean.ref` (see
`content/pipeline/content-graph.ts`). The two relations are different
questions and they diverge in both directions, correctly:

| Situation | Formal edge | Editorial edge | Correct? |
|---|---|---|---|
| Proof calls a `simp` lemma / typeclass instance | yes | no | **yes** — nobody reads about it |
| Theorem motivated by an example it never cites | no | yes | **yes** — the reader needs the motivation |
| Definition the statement is phrased in terms of | yes | yes | yes |
| Library lemma pasted into `uses[]` from Lean | yes | yes | **no** — pollution, see below |

## The prime directive

**Never populate `uses[]` from the Lean dependency graph.** Copying
formal dependencies in destroys the editorial signal and inflates every
ordering metric computed from it (graph energy, forward refs, cone
size, PageRank). If you are tempted to "sync" the two, stop — that is
the failure mode this axis exists to prevent.

When reviewing, do not open the Lean file to decide what belongs in
`uses[]`. The question is about the reader, not the proof term.

## Workflow

1. **Read the `.md` as a reader.** Cold. Do not read the `.ts` first —
   you want your own sense of what the block presumes before you see
   what the author declared.

2. **List what the narrative actually leans on.** Note every point
   where the prose:
   - uses notation it does not introduce,
   - names an object ("the canonical $X$") defined elsewhere,
   - argues *against* or *refines* a prior result,
   - presumes a construction the reader would otherwise have to
     reconstruct.

3. **Now read `uses[]`** in the `.ts` manifest and compare both ways.

4. **Judge completeness.** Anything from step 2 missing from `uses[]`
   that a reader would genuinely stumble over ⇒ **fail (major)**. A
   reader who could carry on unbothered ⇒ at most **warn**.

5. **Judge editorial fitness.** For each listed entry, ask: *would a
   reader be worse off having not read this first?*
   - Yes ⇒ fine.
   - No, and it looks like a formal artefact (a `simp` lemma, an
     instance, a library lemma the prose never mentions) ⇒ **fail
     (major)**. This is the pollution case.
   - No, but it is defensible context ⇒ **warn**.

6. **Write the sidecar entry** under `uses-editorial-completeness` with
   `reviewer.kind: "agent"` (or `"human"`), citing file:line and a
   verbatim quote for every finding — the block-QA evidence contract.

## Verdict rubric

| Verdict | When |
|---|---|
| `pass` | List reads as a deliberate editorial judgement; nothing a reader needs is missing; nothing present is dead weight. |
| `warn` | A marginal entry, or a missing dependency a reader could shrug off. |
| `fail` | A missing dependency a reader would stumble over, **or** an entry that is plainly a copied-in formal dependency. |

## Forward references and `foreshadows[]`

A `uses[]` entry pointing at a block that appears *later* in the chapter
is a `detangler-no-forward-ref` finding. Sometimes that is right — the
exposition really does defer — and `foreshadows[]` (a subset of `uses[]`,
enforced by `foreshadows-subset-of-uses`) declares it, permanently
exempting the edge.

Permanently is the operative word. A wrong declaration does not merely
mislabel: it hides a genuine ordering defect behind an authored claim
that the disorder was intended, and nothing downstream re-opens it. The
contract in `BlockBase.foreshadows` is strict — the prose must **frame
the reference as deferred** ("we will need X, proved in chapter 9").

The bar is a first-person authorial hand-off that says the treatment
happens *elsewhere*: "we establish this in X", "we work this out
separately", "the derivation is recorded in X". In a review of 274
forward edges, every declaration that survived adversarial re-review had
that shape, and **17 of 23** first-pass declarations did not and were
withdrawn.

| Looks like a deferral | Actually |
|---|---|
| Bare cross-reference — "See [X] in Chapter 7" | `ordering`. Says nothing about direction. |
| Organizational pointer — "these tables are projections of this master table" | `ordering`. About structure, not sequence. |
| Block asserts the target's conclusion as background, then reasons onward from it | `ordering`. Consuming a result is the opposite of deferring it. |
| Target listed under "## Rigorous results" / "## Consumers / downstream" | `ordering` — and check the direction; these often run target→source. |
| A forward-looking word ("below", "later", "we must show") | `ordering` unless the sentence is about *this target's placement*. "Below $n^*$" is a numeric comparison; "we must show" is usually about research, not chapter order. |

Two failure modes survive a verbatim quote, so check both before
declaring:

- **False locator.** "the functor of the *next subsection*" where the
  target is 21 sections and ~300 blocks away. The prose defers; it does
  not defer *this far*, and the edge is a real defect.
- **Mis-aimed deferral.** The quoted sentence hands off to a *different*
  block than the edge under review. A deferral pointed elsewhere cannot
  exempt this one.

## A block's `uses[]` may be carrying the whole family

**Never judge an entry from the block's own `.md` alone.** A block is the head
of a family — `X-proof`, `X-interpretation`, `X-tableN-data` — and the
dependency you are looking for is often in a child while the *declaration* sits
on the parent.

- **Table children.** Pointer-style blocks ("See Table 3") keep their substance
  in `tbl:…-data`. A name-and-notation search of the parent's `.md` reports an
  absence that is not real.
- **Proof children.** A proof cites what the statement assumes. In one case the
  parent's prose genuinely never named the target, its **proof child cited the
  target by label** for the exact identity the parent's boxed formula is built
  from — and that proof declared no `uses[]` of its own. The parent's entry was
  the **sole record** of the dependency, so deleting it as "unsupported by the
  prose" would have erased the edge entirely.

So before removing an entry, check whether any child leans on the target, and
whether that child declares anything itself. An entry that looks like dead
weight on the parent may be the family's only declaration.

Searching for the target's *words* also misses a lean on the target's *object*
— a source writing "the canonical $\tilde w_\lambda$" depends on whatever
defines the undeformed $w_\lambda$, whether or not it ever says so.

## One reading is not the standard

Adjudicating `uses[]` is not a task where a careful pass suffices, and the
numbers say so rather than intuition:

- A pass over 274 forward edges had its **destructive verdicts re-reviewed**:
  3 of 35 deletions and **17 of 23** foreshadow declarations were overturned.
- A later slice of 8 edges — 6 of them reported by a single earlier reader, 2
  of those "verified directly against the text" — went to **two independent
  readers**. Both returned *keep* on **all eight**, agreeing row for row. Every
  refutation rested on positive evidence, not on a tie-break. Both "verified"
  ones had been checked by keyword search over the `.md` alone.

Use **two readers who cannot see each other's verdicts** for anything that
edits the graph, and treat agreement as the signal. Where they disagree, or
where either is unsure, leave the edge alone: a wrongly deleted editorial edge
silently corrupts every ordering metric computed from the graph, and nothing
downstream catches it.

**A retarget carries both burdens.** It asserts this edge is wrong *and* that
one is right, so it needs evidence for each half separately. In the slice above
one retarget's second half was true — the proposed target really was leaned on
and really was missing — while its first half was false. Split, it was not a
swap but an **addition**, and both edges survived.

## Reading the mechanical findings first

Run the script half before adjudicating — it is cheap and it changes
what you should look at:

```sh
bun run content/pipeline/qa-checkers-uses.ts   # via qa-sweep --axis uses
```

| Mechanical finding | What it means for your review |
|---|---|
| `uses-editorial-hygiene` **fail** — unresolvable label | A dangling reference. Fix the label or add the missing block *before* judging completeness; the graph is wrong until you do. |
| `uses-editorial-hygiene` **warn** — transitive redundancy | Tidiness only. The graph is correct, just not minimal. Do not let it distract from the completeness question. |
| `uses-formal-coverage` **warn** — formal-only targets | **Advisory.** A list of blocks the proof leans on that the narrative never introduces. Read each one and ask whether the narrative owes the reader an introduction. Most will not — that is the expected answer. Never bulk-apply these to `uses[]`. |

`uses-formal-coverage` is the one place formal structure informs this
review, and it informs it as a *question*, never an instruction. It
returns `n/a` when the Lean Atlas cache is absent; an empty formal edge
set means the data was unavailable, not that the block is clean.

## When an exposition gap is real

If `uses-formal-coverage` surfaces a formal dependency and, reading the
narrative, you agree a reader is left stranded — the fix is usually
**prose, not a `uses[]` entry**: introduce the object, or cite the
result inline. Add to `uses[]` only when the reader genuinely must go
read that other block first. Record the reasoning in the sidecar
`notes` either way, so the next reviewer does not re-litigate it.

## Interaction with other skills

| Skill | Interaction |
|---|---|
| `content-graph` | Owns the graph the mechanical checks read |
| `detangler-integration-watcher` | Consumes the editorial relation for ordering metrics — a polluted `uses[]` corrupts its output |
| `proof-gap-audit` | An exposition gap here often coincides with an inter-proof gap there |
| `proof-simplifier` | Extracts shared lemmas; new blocks need `uses[]` entries authored, not derived |
| `prepare-merge` | Runs the `uses` axis as part of the content gates |
