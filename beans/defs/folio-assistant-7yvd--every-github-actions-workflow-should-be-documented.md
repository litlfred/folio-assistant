---
# folio-assistant-7yvd
title: Every GitHub Actions workflow should be documented as BPMN, and nothing checks that they are
status: todo
type: task
parent: folio-assistant-ahvw
created_at: 2026-09-20T06:52:21Z
updated_at: 2026-09-20T06:52:21Z
---


Owner, 2026-09-20: *"make sure all workflows documented as bpmn"*. Queued rather than started — raised mid-turn while bean `6pfo`'s staging-record wiring was in flight, and the standing instruction is to queue rather than pivot.

## What this is NOT

There are already ten BPMN beans, and none of them is this one. `skills/workflows/*.bpmn` documents **agent processes** — how an agent decides what to do, the CRDM phases, the publication path. This is about the **`.github/workflows/*.yml`**: the mechanical processes that actually run, which are documented today only in YAML comments.

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

## Done when

A person can see the shape of every workflow that runs here without reading its YAML, and a workflow that changes shape without its diagram changing is a failure somebody is told about.
