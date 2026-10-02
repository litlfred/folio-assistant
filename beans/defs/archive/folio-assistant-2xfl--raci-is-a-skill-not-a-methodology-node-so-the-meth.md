---
# folio-assistant-2xfl
title: RACI is a skill, not a methodology node, so the methodology graph reports 5 where a reader expects 7
status: completed
type: task
priority: normal
created_at: 2026-09-22T20:12:47Z
updated_at: 2026-09-22T23:29:06Z
parent: folio-assistant-ahvw
---

Found by the new `check:methodology-evidence` axis, 2026-09-22. It reports **5** methodology nodes: dmn, kepner-tregoe, madr, swot, grade. Sibling of `h97v`.

## What is actually there

| | node in the `methodology` graph | its own subgraph dir |
|---|---|---|
| dmn, kepner-tregoe, madr, swot | yes (`methodologies/*.md`) | no |
| grade | yes (`smart-kg/methodologies/grade.md`) | no |
| **raci** | **NO** | yes, `methodologies/raci/`, declared `skills` |
| **crdm** | **NO** | yes, `methodologies/crdm/`, declared `skills` |

`raci.md` carries SKILL front matter (`allowed-tools`, `consulted`), not `$schema: folio-methodology/v1`. So it is a skill that happens to live under `methodologies/`.

## Why this is not obviously a defect

**CRDM is correct as-is.** It is a house method with no external origin, and `methodology-adoption` is explicit: a method with no origin "is a house process, write it as a skill and do not dress it as an adoption". A methodology node for CRDM would be exactly the dressing that rule forbids.

**RACI is the open question.** RACI *is* an external, named technique with a literature. By the same rule it should have a node, and its absence means the methodology graph does not list a methodology this repository uses. But it is modelled as an overlay over declared processes and roles rather than as a judgement method, which is a real difference from the other five: they answer "how do I decide", RACI answers "who is involved".

## Not decided here, deliberately

Whether RACI is a methodology or a modelling overlay is the owner's call, and it changes what `check:methodology-evidence` should report. Left as a finding rather than settled by the agent that found it.

## Done when

- [x] the owner rules on whether RACI is a methodology node, an overlay, or both
- [x] if a node: a `raci` node with an `origin`, and the skill keeps its own file
- [x] `methodology-adoption` says which of the two shapes a new adoption takes

## Summary of Changes

**Owner's ruling, 2026-09-22: "raci is a methodology."** Settled the question
this bean was opened to hand over rather than decide.

- **`cat-harness/methodologies/raci.md`** — the node. The four letters with
  their directions, the exactly-one-Accountable constraint, and the four things
  RACI is not (a decision method, an approval gate, a permission model, a party
  registry).
- **`skills/raci/raci.md` no longer restates the method.** It now names the
  node and keeps only this platform's application: R read from the BPMN lane,
  the `folio:raci` element, `check:raci`, and the project-initiation procedure.
  Its "exactly one Accountable" section keeps the ENFORCEMENT and hands the
  constraint back to the node; its "what this is NOT" keeps the three that are
  about the overlay.
- **`methodology-adoption` §"Node, skill, or both?"** — the third done-when.
  A table plus three worked cases: `raci` (both), `crdm` (skill only, because a
  house method with no external origin must not be dressed as an adoption),
  `swot` (both from the start).

### The part worth reading: it is adopted with NO source, and says so

Every other node names a text. This one cannot. `doi.org` and `pmi.org` fail
through this container's proxy (re-measured, not recalled), and RACI's commonly
cited sources — PMI's *PMBOK Guide* RAM treatment, the Linear Responsibility
Chart literature — are a paid standard and books. **No open-access primary
exists to fetch**, which puts RACI in `kepner-tregoe`'s bucket.

So the node carries a boxed warning that the rendering is not backed, lists
those two as CANDIDATES TO FETCH rather than as provenance, and leaves
`evidence` absent. `check:methodology-evidence` reports it unbacked, which is
correct and must not be "fixed" by adding a citation nobody fetched.

### A count this changed

The axis now reports **7 nodes, 1 backed** — up from 5. RACI is one of the two
new ones; the other is `diig`, which arrived from #881 while this was being
written and was never this bean's.

`bun run gates` — 127/127.
