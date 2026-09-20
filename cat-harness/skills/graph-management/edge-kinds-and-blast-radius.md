---
name: edge-kinds-and-blast-radius
description: >-
  A graph has more than one kind of edge, and conflating them corrupts both the
  ordering and the impact answer. Interface edges versus implementation edges,
  the union rule for blast radius, and the split/merge signals — generalized
  out of the formal-math skills that first stated them.
capability: architecture
package: graph-management
# consulted: reference material nobody performs — a PRINCIPLE about graph semantics. Zero imperative markers and every heading is a claim — "Not every edge is a dependency", "Provenance is three-valued", "Taint propagates down the dependency graph". It is read before deciding how to traverse a graph; nobody performs it as a task.
consulted: true
---

# Edge kinds and blast radius

> Skill id: `edge-kinds-and-blast-radius` · Capability: `architecture` · Package: `graph-management`

These rules were first written for a formal-mathematics corpus — Lean
declarations, propositions, proof terms. Each one below is the domain-free form,
with the domain version named so the lineage is traceable rather than erased.

**Which rules did NOT generalize is in `domain-fencing.md`.** A rule that
survives translation and a rule that does not are different findings, and
collapsing them is how a platform acquires somebody else's mathematics.

## Not every edge is a dependency

The rule, from `chapter-complexity-review`:

> "weight logical backward edges heavily and storytelling backward edges at
> zero … the headline metric is the **logical backward-edge count**, not the
> raw backward-edge count."

Domain-free: **a graph carries several edge kinds, and a partition decision
uses one of them.** Counting all edges alike inflates the tangle with edges
nobody would ever have to break.

The repository-scale analogue is already implemented and says the same thing in
one line — `scripts/repo-partition.ts`: *"A test may reach anywhere it needs
to; that is what a test is for."* Test edges are exempt from the DAG.

## Ordering uses ONE kind; impact uses the UNION

Stated three times, in three files, before anyone noticed it was one rule:

> "Impact questions ('what breaks if this changes?') want the **union** of both.
> … The reorganisation heuristics in this skill are **editorial-only** by
> design: reading order is a question about readers, so mixing formal edges in
> would make the answers wrong, not richer."

Domain-free:

| question | edge set |
|---|---|
| where does this node belong / what order | **one** kind — the one the ordering is about |
| what breaks if I change this | the **union** of every kind |

Conflating them corrupts both: the ordering acquires edges that were never
about reading order, and the blast radius misses edges it needed.

## Interface edges versus implementation edges

The sharpest of the lifted rules, and it exists today only in Lean vocabulary.
From `lean-formal-graph`:

> "**type** — the declaration's signature mentions the target. Changing the
> target changes what this block **claims**.
> **value** — only the proof term mentions it. Changing the target changes how
> the block is **justified**, not what it says."

Domain-free: **an interface edge is one the node's contract depends on; an
implementation edge is one only its body depends on.** Only interface edges
propagate the semantic cone.

This is exactly the distinction a repository split needs and does not currently
draw. A public-API import must move with the module. A private-helper import
need not — it can be replaced, inlined, or inverted without any consumer
noticing. Today `repo-partition.ts` counts both alike, which is the safe
direction (it over-reports the tangle) but leaves the cheapest class of fix
invisible.

## Blast radius names the split candidates

From `detangler-block-tanglement`:

> "out_degree / in_degree / cone_size (transitive blast radius) / fwd_received /
> edge_span / depth / pagerank … High tanglement or deep/central placement
> signals a node that may warrant a **split**, relocation, or dependency-edge
> pruning."

Domain-free as written — the only domain word is a parenthetical gloss on
`depth`. Note the three remedies are the same three the cycle rule gives, which
is the sign that this is one practice rather than two.

## Common-subgraph extraction

From `proof-gap-audit` §J:

> "When two or more proofs in a chapter invoke the **same block** with the
> **same hypotheses**, the shared sub-derivation should be promoted to its own
> block. **Threshold**: 2 invocations is informational; 3+ is a
> major-severity abstraction gap."

Domain-free: **when k dependents share an identical sub-path, extract it as a
node.** And the stated rationale generalizes verbatim, which is the test that it
is not a domain rule wearing a general coat:

> "(a) increase the chance of inconsistent edits later (one copy gets fixed,
> others drift), (b) inflate the dependency graph energy unnecessarily, (c) hide
> the fact that the shared content is itself a theorem worth naming."

(a) and (b) are the duplicate-module argument in a repository split, word for
word.

## Overlap is a merge signal

From `proposition-consolidation-audit` H3–H5:

> "Two blocks A, B with `A.uses ∩ B.uses` covering > 70% of A.uses … where
> neither cites the other, are candidates for sibling-merger."

Domain-free once the kind list is stripped: **two nodes whose dependency sets
overlap heavily and which do not reference each other are merge candidates.**
H4 (identical citation tuple) and H5 (tag sets within one element) are likewise
pure set-overlap rules.

The threshold is a tunable constant, not a law. What generalizes is the shape:
*high dependency overlap plus no edge between them* means the partition has
split something that was one thing.

## Provenance is three-valued

From `lean-formal-graph`, and independently from `repo-partition.ts`:

| value | meaning |
|---|---|
| authoritative | the tool read the real structure |
| indicative | derived by scan or keyword; *"a missed edge SHRINKS results, which is the dangerous direction"* |
| **absent** | **`n/a`, NOT "no dependencies"** |

`repo-partition.ts` states the same three-valued discipline for module
classification — `rule` / `triage` / `keyword` / `default`, plus `unassigned` —
and its header gives the reason: *"'could not determine' is a distinct answer
from 'determined to be core', and collapsing the two is how a wrong partition
looks like a clean one."*

**This discipline appears independently in at least six places in this
repository.** It is stated here once, and the others should point at it rather
than restate it.

## Taint propagates down the dependency graph

From `proof-gap-audit` §I, whose every label is mathematical but whose shape is
not:

> "Theorem/proposition whose `uses[]` (transitively) includes a `conj:` **must**
> be demoted to `conjecture`."

Domain-free: **a confidence or status label propagates transitively, and a node
may not claim a stronger status than its weakest ancestor.** Recorded as a
generalizable *pattern* rather than a reusable rule — it needs a lattice of
statuses to be instantiated against, and the platform has none.

## Split and merge are never auto-dischargeable

> "**Section merge is deliberately NOT auto-discharge** — it renames labels and
> ripples through cross-references; always escalate."

Directly applicable to extraction. The operations that change a node's *name*
or *address* are the ones whose blast radius exceeds what the graph records,
because references by name are not edges the tool can see.
