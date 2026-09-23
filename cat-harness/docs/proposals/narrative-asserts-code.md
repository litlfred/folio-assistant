---
title: "Does the prose say what the artefact does?"
kind: proposal
issue: 1042
bean: folio-assistant-flbx
summary: >-
  One review axis for every declared prose ↔ code pair, with Lean as a specialisation rather than the model. Signed off 2026-09-23 as three stages: a staleness flag, then mechanical claim checks, then a review branch that sends disagreement to adjudication.
---

# Does the prose say what the artefact does?

Issue [#1042](https://github.com/litlfred/folio-assistant/issues/1042) · feature bean `flbx` · signed off by the owner on 2026-09-23.

A reader, human or agent, acts on what the prose says. When prose and
artefact disagree, the reader either avoids a working feature or rebuilds it.
Bean `77ex` put it as *"a stale gap notice is worse than none"*.

## What already existed

| pair | checked by | limit |
|---|---|---|
| paper proof prose ↔ `.lean` | `proof-narrative-lean-equivalence` (agent skill) | Lean only; bean `nrv8` found its sweep never read the narrative |
| `AGENTS.md` ↔ code | `check:agents-claims` (bean `77ex`) | two claim shapes, and it says so on every run |
| BPMN step documentation ↔ `.github/workflows/*.yml` | sourced by hand for 95 steps in PR #1025 | nothing re-checks it when the YAML changes |

`review-task.bpmn` classifies a change as prose, code, or both. For **both**,
the two reviews run separately, and **nothing compares the prose with the code
it describes**. That is the gap.

The pairings are already declared, so nothing has to guess what describes what:
`<folio:implements workflow="…">` on 9 diagrams, 23 skill `.md` files beside a
same-stem `.ts`, and a paper block's `lean.ref`.

## Requirements (agreed)

| # | requirement |
|---|---|
| R1 | Applies only to **declared** pairs; an undeclared pair is out of scope and the run says how many it did not look at. |
| R2 | When one side of a pair changes and the other does not, flag *prose not re-reviewed*, keyed by content hash. Mechanical; no language parsing. |
| R3 | Claims naming a resolvable thing (symbol, path, CLI flag, exit code, workflow job or `if:` step) are checked mechanically. Anything else is *not parsed* and counted, never passed. |
| R4 | A claim the machine cannot settle goes to a reviewer in a new `review-task` branch. A reviewer–checker disagreement calls `Process_Adjudication`. |
| R5 | The general skill carries no Lean specifics; `proof-narrative-lean-equivalence` becomes its Lean specialisation, in its own subgraph. |
| R6 | Results are entries in the existing QA sidecar families, not a new store. |
| R7 | Starts advisory (minor); becomes gating only once a clean run shows it does not cry wolf. |

## The staged plan

| stage | bean | builds | requirements |
|---|---|---|---|
| **B** | `cuxx` | the staleness flag: `prose-reviewed-since-code-changed` in `kg:audit`, attestations kept in the subject's kg-qa sidecar, `pairs:attest` as the re-review mark | R1 R2 R6 R7 |
| **A** | `ca4a` | `check:agents-claims` generalised to every declared pair | R3 |
| **C** | `chhd` | the `review-task` branch and general skill, calling adjudication | R4 R5 |

B came first because it asserts nothing about *truth*: it only says the code
moved while the prose stood still. So it cannot cry wolf, and its flags are
exactly the input A and C need.

## What would change this

- If B's flags are mostly noise on real edits (prose that did not need
  re-reading), R2's asymmetry is wrong and B should key on something narrower
  than a whole-file hash.
- If A's *not parsed* count stays high across pair kinds, most claims are not
  written as resolvable symbols, and C carries more of the load than planned.
