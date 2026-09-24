---
# folio-assistant-h588
title: 'TOOL 12/13: l3-fhir-pipeline / ig-incremental-build — FHIR, IG, DAK (3 files, 0 entry points)'
status: completed
type: task
priority: low
created_at: 2026-09-20T04:35:26Z
updated_at: 2026-09-20T11:24:04Z
parent: folio-assistant-d308
---

Group 12 of 13 in `d308`. **3 files, 0 entry points** — `fsh-cone`, `dak-pdf`,
`qa-checkers-dak`.

**BPMN:** `l3-fhir-pipeline · Task_Sushi · Task_Validate · Task_IgPublisher`, and
`ig-incremental-build · Task_Cone` — which names `fsh-cone --changed` directly in
its task label, so the binding is not inferred.

**Target repo (#223):** `smart-base`.

**Why it is `low` and not `normal`:** three files, and the platform carries no
folio, so `qa-sweep` and `witness-refresh` FAIL BY DESIGN here — the first
preflights on `content/package.json`, the second needs
`folio-assistant/computations/`. A Tool node for this group cannot be exercised in
this repository. That is not a reason to skip it, but it is a reason to build it
after the twelve that can be verified where they live, and to say on the node that
its verification happens downstream.

## Done when
- [ ] a Tool node for the cone / SUSHI / publisher path
- [ ] `satisfies` names `l3-fhir-authoring`, `fhir-validation`, `ig-publication`
- [ ] the node states that it cannot be exercised in the platform repo, and why
- [ ] not "verified" on the strength of a dispatch that fails by design

---

## 2026-09-20: this bean's "cannot be exercised here" is not special to FHIR

`d308`'s CORRECTION established it for **six of the thirteen groups**: Lean
(0 files this repo can run), LaTeX (0), Bibliography (0), FHIR (0), and
effectively QA sweep (2 of 27) and Content graph (1 of 19).

So the posture this bean recorded first — *author here, verify in a folio, and
say so on the node* — is the general case rather than this group's quirk. Worth
promoting into whatever skill covers Tool authoring, so the next twelve nodes do
not each rediscover it.

What stays specific to this bean: `qa-sweep` and `witness-refresh` do not merely
lack a folio here, they **fail by design** — the first preflights on
`content/package.json`, the second needs `folio-assistant/computations/`. A green
dispatch of either in this repo would be the anomaly, not the goal.


---

## 2026-09-20: `fsh-cone` authored, and TWO of the three contracts REFUSED

### The "0 entry points" was an npm-script count

`fsh-cone.ts` and `dak-pdf.ts` both have `import.meta.main`. As with `1oqu`, the
bean's figure counts npm scripts, and there are none for this group. Two measures,
different answers, both true — worth stating because a reader chasing "0 entry
points" would conclude there is nothing to invoke.

### Two of the three skills the bean named refuse this mechanism

The bean asked for one node satisfying `l3-fhir-authoring`, `fhir-validation` and
`ig-publication`. Checked against their own contracts:

| skill | contract requires | verdict |
|---|---|---|
| `fhir-validation` | `igRoot` | **satisfiable** — `fsh-cone.ts <ig-root>` |
| `ig-publication` | `igRoot` + `versionIncrement` | refused |
| `l3-fhir-authoring` | `artifactType` + `l2Source` | refused |

**Verified by declaring all three and letting the gate reject them**, rather than
reasoning about it:

```
✗ 2 satisfies edge(s) the skill's own contract contradicts:
    fsh-cone → ig-publication     requires: versionIncrement   accepts: igRoot, csv
    fsh-cone → l3-fhir-authoring  requires: artifactType, l2Source
```

**These refusals are correct, not a gap to close.** `fsh-cone` computes a
dependency cone over a FSH graph: it publishes nothing and authors nothing, so
there is no version to increment and no L2 source to render from. Declaring the
edges would nominate this node as the mechanism for two jobs it does not do —
`covered-is-not-reachable` manufactured deliberately. So the bean's second "Done
when" box is struck rather than ticked, with the gate output as the reason.

This is the same shape as the earlier finding that authoring contracts name an
OUTPUT while the corpus's mechanisms take an INPUT: `l3-fhir-authoring` starts
from an L2 source because authoring begins with one, and a cone analysis starts
from a built IG.

### What IS checked here, and what is not

The platform carries no folio, so the cone cannot be exercised against real FSH
in this repository — the posture this bean recorded first and `d308`'s correction
generalised to six of thirteen groups. The node says so in its own comment.

What does not need a folio was measured: **a missing `<ig-root>` exits 2** with
usage. Third state correct, and it is the half a downstream verification would not
re-check.

### Not covered, and named rather than left implicit

- **`dak-pdf.ts`** takes `<dak-repo> -o <out.pdf>` and returns 2 both for missing
  arguments and for a non-existent directory — good behaviour, but it satisfies
  none of the three contracts either (no `versionIncrement`, no `l2Source`), so it
  needs a skill that fits rather than an edge forced onto one that does not.
- **SUSHI and the IG Publisher** are external programs, not files in this group —
  a node over them is an `install`-arm question about a dependency, which is a
  different kind of node from the three this bean enumerates.
- **`qa-checkers-dak.ts`** has no main; it is a checker reached through `qa-sweep`.

### A vocabulary gap, now seen twice

`--top N` and `--history N` are counts and stayed undeclared, because
`tool-types.ts` publishes **no numeric type** — `Dpi` and `Port` are the only
numeric-ish entries and both mean something specific. `--changed f1,f2,…` stayed
undeclared for the reason `qa-sweep` already records: a comma list inside one argv
word has no honest shape in the vocabulary.

Second node to hit the numeric gap (after `content-graph-build`). It is a
vocabulary question rather than a per-node one, and adding a type to fit a flag is
how a vocabulary stops meaning anything — so it stays documented, not mistyped.

## Done when

- [x] a Tool node for the cone path — `fsh-cone`, satisfying `fhir-validation`
- [~] ~~`satisfies` names all three~~ — **two refused on their own contracts**, gate output above
- [x] the node states that it cannot be exercised in the platform repo, and why
- [x] not "verified" on the strength of a dispatch that fails by design — nothing was dispatched; what was measured is the exit-2 path, which needs no folio
