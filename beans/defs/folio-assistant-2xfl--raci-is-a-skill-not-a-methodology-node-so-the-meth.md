---
# folio-assistant-2xfl
title: RACI is a skill, not a methodology node, so the methodology graph reports 5 where a reader expects 7
status: todo
type: task
created_at: 2026-09-22T20:12:47Z
updated_at: 2026-09-22T20:12:47Z
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

- [ ] the owner rules on whether RACI is a methodology node, an overlay, or both
- [ ] if a node: a `raci` node with an `origin`, and the skill keeps its own file
- [ ] `methodology-adoption` says which of the two shapes a new adoption takes
