---
# folio-assistant-vuip
title: 'GOAL 1: separation of repos into dir/repos, each harness instantiation with config and initiation steps skilled, tooled and tested'
status: in-progress
type: milestone
priority: high
created_at: 2026-09-20T18:47:55Z
updated_at: 2026-09-20T18:47:55Z
---

The owner's words, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), kept verbatim
because a goal paraphrased by an agent is a different goal:

> get to separtion of repos into dir/repos with each harness instiatiatin w/
> config and initation steps skilled, tooled, and tested (readme, creation of
> directories, active vs static content -- beans todos fsh-guts,etc.)

Created on the owner's ruling for bean `wqht`: *"wqht - milesotne"*. Until
now the three goals existed only as chat text, so every review reclassified
140 open items by hand. This is where goal 1 lives.

## Epics under this milestone

| epic | why |
|---|---|
| `vke6` | SPLIT (#223) — cutting the repo into layers that can depend on each other, which is the goal's first clause |

## Named in the goal, and where each lives

- **config and initiation steps** — `b5f0` (what it means to instantiate),
  `zkgs` (the per-instance config filename), `wwi6` (uploads/ and library/ at
  initiation), `lv3j` (a BPMN precondition for initialize-harness)
- **README** — `b963` fixed the cold-start path the entry documents named;
  `cat-bootstrap/README.md` is the cold reader's entry point
- **creation of directories** — `rday` (a declaration adds and overrides, it
  does not withdraw), `wwi6`
- **active vs static content** — the `holds: content | context | state` axis,
  and `hqku`'s open question about `library/`. `b5f0` §5 argues the missing
  axis is `derived` rather than `dynamic`
- **beans, todos, fsh-guts** — `x89g` (beans/ as a real graph), `c4rz`
  (the todos graph), `t0i3` (fsh-guts as a declared non-renderable graph)

## Deliberately NOT parented here

`zzmr` (KG structure) and `1xhc` (CI reliability) both carry work this goal
needs and work two other goals need. Assigning them here would claim a
breadth they do not have. Listed rather than parented, which is the honest
state until the owner says otherwise.

## Status, measured 2026-09-20

`zlmp` — the gate `vke6` names for the whole cut — is at **0
wrong-direction edges**, re-measured on main at `4cdd77d7d8` with 0
unassigned modules. The critical path is now `wggr` (invert the stub
pattern for the workflow files, `skills/` and `schemas/`), then
`b5f0` / `zkgs`, then `zmdo` (fork twice and prove an empty-repo bootstrap).

## Done when

- [ ] A new, empty repository can say "bootstrap a litlfred/folio-assistant
      here" and get a working instance — `zmdo`'s acceptance test, and the
      goal's own falsifier
- [ ] Each instantiation declares its config in one file at its own root
- [ ] The initiation steps are skilled, tooled and tested: a skill that
      governs them, a Tool node that performs them, and a test that fails
      when they do not run
