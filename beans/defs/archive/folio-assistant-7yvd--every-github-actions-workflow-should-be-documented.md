---
# folio-assistant-7yvd
title: Every GitHub Actions workflow should be documented as BPMN, and nothing checks that they are
status: completed
type: task
priority: normal
created_at: 2026-09-20T06:52:21Z
updated_at: 2026-09-20T13:16:18Z
parent: folio-assistant-ahvw
---


Owner, 2026-09-20: *"make sure all workflows documented as bpmn"*. Queued rather than started — raised mid-turn while bean `6pfo`'s staging-record wiring was in flight, and the standing instruction is to queue rather than pivot.

## What this is NOT

There are already ten BPMN beans, and none of them is this one. `processes/*.bpmn` documents **agent processes** — how an agent decides what to do, the CRDM phases, the publication path. This is about the **`.github/workflows/*.yml`**: the mechanical processes that actually run, which are documented today only in YAML comments.

## Why it is worth doing

AGENTS.md: *"Every process here is BPMN, and the diagrams are executable."* The CI workflows are processes by any reading — they have triggers, gateways, parallel jobs, compensation paths — and they are the ones whose behaviour a person most often has to reconstruct from comments. `feature-staging.yml` is the sharpest case: `stage`, `cleanup` and `cleanup-dispatch` form a lifecycle with a confirmation gate and a deletion trigger, and the only place that shape is written down is a 60-line comment block.

## What "documented" has to mean here, or it is worthless

A diagram that is drawn once and then drifts is worse than none, because it is consulted. So this is not "draw some BPMN" — it is:

1. A **derivation or a check**, not a hand-drawn set. Either the diagram is generated from the workflow, or something fails when a workflow gains a job the diagram does not have. `render:bpmn:check` is the existing shape for the second.
2. **Coverage is measured**, not asserted. "All workflows" needs a list of what exists and what is covered, with the three states — covered, not covered, could-not-determine — and could-not-determine never rendered as covered.
3. The **triggers** are part of the process. A `workflow_dispatch`-only workflow and a scheduled one are different processes; measured 2026-09-20 for bean `6pfo`, 14 of 16 writers here are dispatch-only, and that fact was invisible until somebody looked.

## Open questions, for whoever picks it up

- Does a GitHub Actions workflow belong in the same `kg` graph as the agent processes, or is it a different graph kind? They are both processes, but one has an agent lane and the other never does.
- `bpmn-processes` requires `<folio:skill ref>` on every activity. A CI job runs no skill. Either that requirement is agent-lane-only, or CI workflows need a different element — this is the first real question.
- Is generation feasible? A job's `needs:` is a sequence flow and `if:` is a gateway, so much of it derives mechanically; `run:` bodies do not.

## Progress — the DRIFT half, 2026-09-20

The bean's requirement 1 is *"a derivation or a check, not a hand-drawn set"*,
and its warning is that **a diagram drawn once and then drifting is worse than
none, because it is consulted**. Drawing the six missing diagrams first would
have walked straight into that. So the check came first.

**What was missing, measured.** `check:workflow-coverage` answered *is there a
diagram* — `<folio:implements workflow="…"/>`, three states, per trigger
class. Nothing answered *does it still match*. `feature-staging.bpmn` made it
concrete: three start events for the workflow's three jobs, and **nothing in
the file saying which node was which job**. A fourth job would have left every
check green.

**What now exists.** A node standing for a job declares it —
`<folio:job name="stage"/>` — and the same check compares both sets in **both
directions**: a job with no node (the diagram went stale), a node naming a job
the workflow does not have (it was stale already), and a job claimed by two
nodes. Exit 1, same tier as a dangling `<folio:implements>`, because both
mislead a reader who follows them.

**The design question the bean did not ask, and its answer.** Declaring is
opt-in per diagram, and a covered workflow whose diagram names no job reports
as **undeclared**, not as fully drifted — "nobody has said yet" and "said, and
wrong" are different answers, and only the second is a finding. What is never
allowed is a diagram declaring *some* jobs and reading as complete.

**The falsifier, checked before building.** One job ↔ one node only works if
jobs map cleanly. Measured across all 8 auto-triggering workflows:
**no matrix jobs, no `needs:` chains**. `code-quality-gates` has 5 independent
jobs; `docs-site`, `health-check`, `jsonld-gen-check`, `ci-health` and
`atomic-mass-gen-check` have exactly 1 each. The correspondence is real, not
forced.

**Falsified against a real change**, not just unit tests: a job appended to
`feature-staging.yml` produced `job(s) with no node: a-new-job`, exit 1. The
workflow was restored.

Both existing diagrams now declare their jobs (`feature-staging` 3,
`upstream-pin-watch` 1), so coverage here is 2/2 verified rather than 2/2
asserted. 41 tests in `workflow-coverage.test.ts`.

## The six, classified before drawing — four carry information, two carry drift detection

Read all six first, because a diagram is only worth having if it says
something the YAML does not:

| workflow | shape | why a diagram |
|---|---|---|
| `docs-site` (432 ln) | regenerate ×5 → build → verify tree → **restore open PRs' previews** → publish → **verify they survived** | the `plj1` shape, invisible without reading all 432 lines |
| `ci-health` (164 ln) | three-state verdict → 4 exclusive branches, incl. *refuse to report success on an unchecked repo* | a real gateway |
| `health-check` (209 ln) | same three-state shape, plus `if: always()` artefact upload | gateway + compensation |
| `code-quality-gates` (686 ln) | 5 **independent parallel** jobs, one holding ~30 sequential gates | the parallelism is not otherwise visible |
| `jsonld-gen-check` (102 ln) | one job, 5 sequential `--check` steps | **no exposition** — see below |
| `atomic-mass-gen-check` (47 ln) | one job: regenerate, diff | **no exposition** — see below |

The last two would be a box with an arrow, and padding them out would be the
drift cost with none of the benefit. **They earn a diagram for a different
reason**: without one they carry no `<folio:job>`, so if either gains a job
nobody is told. That is drift detection rather than exposition, and each says
so in its own documentation rather than pretending otherwise.

## Shipped — all six, 2026-09-20

| diagram | the fact it makes visible |
|---|---|
| `docs-site-publish` | `gh-pages` is a FULL REPLACE; restore-then-verify is a pair (bean `plj1`) |
| `code-quality-gates` | five INDEPENDENT jobs — wall-clock is the slowest, not the sum; four hard, one warn-only |
| `ci-health-watch` | only `unknown` fails the job; a red `main` leaves it GREEN and speaks through the issue |
| `repository-health-watch` | same shape one level out; NO removal task, and that absence is the rule |
| `jsonld-drift-check` | minimal by design, and says so |
| `atomic-mass-drift-check` | minimal by design, and says so |

The two minimal ones carry a paragraph stating what they are: drift detection,
not exposition. A reader who opens one expecting the second is told which they
are getting, rather than meeting decoration that still has to be maintained.

**Corrected count**: 8 auto-triggering, 30 dispatch/call-only — an earlier
report of 7/31 came from reading a truncated tail, and `agent-review.yml` is
dispatch-only, not auto.

## Done when

A person can see the shape of every workflow that runs here without reading its YAML, and a workflow that changes shape without its diagram changing is a failure somebody is told about.

- [x] a workflow that changes shape without its diagram changing fails
- [x] the six uncovered auto-triggering workflows carry a diagram —
      **8/8 auto-triggering documented, every one "jobs match"**
