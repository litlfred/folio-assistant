---
# folio-assistant-j79e
title: 'DETANGLE: a candidate subgraph is MEASURED (cohesive, low-cut), not chosen by taste — and the same process runs on modules, Lean and paper layout'
status: todo
type: task
priority: high
created_at: 2026-09-20T08:14:40Z
updated_at: 2026-09-23T02:45:00Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-20, defining the term after four carves had already been picked by judgement:

> 'candidate subgraph = large collection of thematiactally related content that is diconnected (maybe some light detagling) from other parts of the KG. (part of larger process detangle knwoedlge graph. look in lean, paper layout for related. generalize, make subprocess, deangle heuristics...).'

THIS IS A CRITERION, AND IT INVALIDATES THE METHOD USED SO FAR. `folio-assist-core-schemas`, `kg-navigation`, and the four carves chosen in this session were all picked by reading and arguing. Three of them may well survive the measurement; NONE of them was measured, and 'it turned out to be right' is not the same fact as 'it was checked'.

THREE NUMBERS DECIDE IT, and they are the same three every graph-cut question uses:
- SIZE of the candidate node set. 'Large' is in the owner's definition; a two-node subgraph is a file move.
- COHESION -- internal edges over (internal + boundary). 'Thematically related' is what high cohesion MEASURES; the theme is the hypothesis and the number is the evidence.
- CUT -- the boundary edges. 'Disconnected (maybe some light detangling)' is a small cut, and the cut edges ARE the detangling worklist.

AND THE CUT CLASSIFICATION IS THE ACTUAL WORK, not the number. Each boundary edge is one of three things, and only the first is free:
- RESTATEMENT -- the edge exists because a fact is written in two places. Delete one. AGENTS.md's own banner is a standing example of this class.
- WRONG DIRECTION -- the edge points up the layering. It inverts, which is a real change.
- ESSENTIAL -- it must become a DECLARED dependency between instances. `resolveSkillDirs` already computes that overlay for the `cat-harness` graph and nothing computes it for any other.

THE GENERALISATION IS THE POINT, and this repository already runs the same process three times under three names:
- MODULES. `scripts/repo-partition.ts` -- an import-graph partition into five repos whose stated purpose is question 2, 'which import edges cross a proposed boundary IN THE WRONG DIRECTION', and whose answer is 'Phase I's worklist'. That IS cut classification, built, for one graph.
- PAPER LAYOUT. The `uses[]` editorial graph, from which every ordering metric is computed. AGENTS.md: 'Never populate uses[] from Lean -- it destroys the signal every ordering metric is computed from.' Chapter ordering is a cut problem on that graph.
- LEAN. The formal dependency graph machine-derived from `lean.ref`, plus the refactor cluster in issue #198 and `schemas/refactor-strategy.ts`.

Three implementations, one question, no shared vocabulary. `repo-partition.ts`'s three-state discipline ('a module this tool cannot classify is reported as unassigned, never silently bucketed into core') is the one piece that MUST survive generalisation -- it is the same three states as `materialization.ts`.

## Done when
- A generic node/edge cut analysis exists, with size / cohesion / cut and the three-way edge classification.
- It runs over the KG and REPORTS the candidates, so a carve cites a number instead of an argument.
- `repo-partition` is shown to be an instance of it, or a bean records exactly why it cannot be.
- A `detangle-subgraph` subprocess and a heuristics skill exist, and the carves in this PR are re-checked against them.

---

## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `zzmr`.** DETANGLE measures whether a candidate subgraph is cohesive. That is the knowledge graph judging its own structure.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.
