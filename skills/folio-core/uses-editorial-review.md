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
