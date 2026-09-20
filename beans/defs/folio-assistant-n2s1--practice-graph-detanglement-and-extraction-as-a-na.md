---
# folio-assistant-n2s1
title: 'PRACTICE: graph detanglement and extraction as a named sub-practice of KG management'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T13:19:36Z
updated_at: 2026-09-20T13:19:36Z
parent: folio-assistant-vke6
---

## Why this is not another `vke6` child like the others

`vke6` has thirteen children and every one of them is an INSTANCE of splitting
— drain the edges, invert the stub, declare topical directories, settle the
type set, rename a package. None of them is the PRACTICE. Checked before
creating this (`beans list`, 2026-09-20): no bean covers "how do you split a
graph", only "split this particular thing".

That is the gap the owner named:

> "if a repository grows so big that they need to split it out or there's a
> business reason such as splitting content semantically, then I want there to
> be a process and associated skills and task to do so. … It keeps the graph
> connected while still slowly going through a detanglement process before
> splitting off into its own repository."

## The shape

A staged practice, where each stage is a GATE rather than advice, and nothing
moves until the stage before it measures zero:

1. **Declare in place** — the sub-graph is declared where it already sits
   (`harness.json` `directories[]` + `graphs[]`). Still inside, still
   connected, nothing moved.
2. **Detangle** — drive cross-edges toward zero. `scripts/repo-partition.ts`
   is the instrument and it already exists.
3. **Isolate** — the sub-graph carries its own declaration, namespace and
   published artefact.
4. **Extract** — only once edges are zero and the declaration stands alone. A
   directory move rather than a file-by-file sift.

## The rule this practice is actually built on

Measured twice, in one session, both times against me:

- `e5a514e3ff` — I wrote a comment arguing `dak`/`sushi` could stay in core
  and move to a WHO adapter "later". `check:partition:edges` refused within
  minutes: `folio-assist-core → smart-base`. Reaching for `DAK_TYPE` IS the
  edge.
- `eb6c87db42` — same shape again: `agentic-harness → folio-assist-core`,
  because a filename containing "content" classified marker machinery to core.

> **A boundary argued in prose is not a boundary. It holds when the import
> graph enforces it.**

## Citation convention for this practice

Code references are pinned to a COMMIT SHA, and every rule carries a worked
example that actually happened. But a SHA alone is not enough for a document
that exists to support EXTRACTION: after a history rewrite the SHA may not
exist in the extracted repository. So each citation carries the SHA **and the
measurement** — "51 → 0 wrong-direction edges" survives a rewrite, `aa6ce172d1`
may not.

## Done when

- [ ] the practice is one named sub-practice under KG navigation, in
      `cat-harness`, with its skills and their tools
- [ ] the math/Lean-specific detangling rules are generalized, or each is
      recorded as irreducibly domain-specific with the reason
- [ ] the staged process is a BPMN whose stages gate, not advise
- [ ] every rule cites a worked example by SHA and by measurement
- [ ] siblings' SOPs are consolidated rather than duplicated

## Surveyed 2026-09-20 — what exists, and one correction to my own framing

**No practice exists.** All 43 diagrams under `skills/workflows/` enumerated:
no process for splitting, extraction, migration or graph management. No
`methodologies/` entry. Discussions are disabled on the repo. So this is not a
duplicate — but `vke6`/#223 has been EXECUTING the practice for three days
across 19 child beans, and the mechanical half is done: wrong-direction edges
and unassigned are both 0 today.

The risk is therefore not duplicating a document. It is contradicting owner
rulings already recorded verbatim in `zlmp`, `4j3h`, `wggr` and `79t3`.

**CORRECTION TO MY OWN ATTRIBUTION, and it matters for how the practice cites
its examples.** I described the partition as "51 → 12 → 5 → 0" against three
SHAs from today. Wrong. **51 → 0 is the EPIC's arc across 2026-09-18→20 and
several sessions** — bean `zlmp`: 51→44→43→(49)→35→16→10→6→4→2→1. Today's
commits are the LAST LEG only: 8→1 (`07947dce43`, merged `bf60e53b6b`) and
1→0 (`79b476dec7`, merged `aa6ce172d1`), plus unassigned 19→0.

And the shape of that arc IS the practice, which is why getting it right
matters rather than being mere credit:

- **43 → 49** when 13 previously unjudged edges were folded into the count.
- **6 → 7** when a proposed fix was measured and DISPROVED.

A detangling count that only ever falls is a count that is not being measured
honestly. Any SOP this practice ships has to make room for the number going up.

**#223 ALREADY ASKS FOR THIS.** Its closing line, verbatim: *"develop change
migration plan. document current and future state software archictecture."*
Unmet. That is the mandate.

## The one decision that is the owner's, and every bean defers it

**The composition root.** `zlmp`: *"A composition root imports every layer,
because that is its job. `check:partition` measures imports, not intent."*

- **A** — declare it exempt, named as an exception.
- **B** — no built-ins; everything becomes a real dependency with `contributes`.
- **C** — built-ins self-register at the CLI entry point.

`zlmp`'s own reading: *"**B** as the destination, **C** as the step that reaches
it without a flag day. Not decided — it shapes the split, so it is the owner's
call."* It blocks nothing today only because the edge count happens to be zero.

## Constraints on where this lands

- `cat-harness/methodologies/<name>/` is the convention (`dmn.md`,
  `kepner-tregoe.md`, `madr.md`). **PR #500 is moving that directory now**,
  adding `raci/` and `crdm/` — expect a path conflict.
- Three siblings are doing split work concurrently: **#505** (`content/` →
  `folio/`, 2,408 occurrences — bean `rnfl` says `todo` but it is live under
  `hs08`), **#494** (a `target repo` column — layer assignment by another name,
  posted on #223 itself), **#477** (layer-boundary moves under `wggr`).
- **MVP is undefined for both layers**, which is what blocks `zmdo`. The owner
  has already said "not zmdo yet, need code separation to stabilize", which is
  consistent with leaving it undefined for now.

## Nearest existing diagrams, for reuse rather than reinvention

`upstream-version-adoption.bpmn` and `upstream-pin-watch.bpmn` are the closest
in spirit — both are about a dependency edge between repositories over time —
but both assume the other repository already exists and say nothing about
creating one by subtraction. `crdm-*` is the methodology a split would plausibly
be run THROUGH rather than replacing.
