---
# folio-assistant-v49e
title: 'WORKFLOW VIEW: cat-harness folio shows where todos and beans sit in the BPMN/DMN, and where a process is breaking down'
status: todo
type: task
created_at: 2026-09-20T14:01:05Z
updated_at: 2026-09-20T14:01:05Z
parent: folio-assistant-yj32
---


Owner, 2026-09-20, in two messages:

> cat-harness folio should have function to show workflow mgmt... where
> todso/beans are in bpmn/dmn. should have specialized browser visualzier to
> see where process is breaking down.

> ...it should also be able to see working context/memory based on dependcy
> tree for that task.... see logs associated to it. (do not do this, just bean
> up)

## Why this is buildable rather than speculative

Every piece it needs already exists as committed state:

- **The diagrams are executable.** `.bpmn` under `skills/workflows/` are the
  source of truth, and `workflow_list` / `workflow_start` / `workflow_next` /
  `workflow_gate` / `workflow_complete` run them.
- **Position is committed, not in a session.** Running instance state lives in
  `beans/workflows/`, one JSON per instance, tagged
  `"$schema": "folio-workflow-instance/v1"` — so a sibling session sees the same
  position, and so can a renderer.
- **Steps already name their bean.** `<folio:bean op>` on an activity is what
  the engine performs, so "where is this bean in the process" is a join over
  data that is already there rather than a new annotation.
- **`todos/` is the human half** of the same 2×2 — a person's outstanding items
  against the agent's work plan — and both are declared graphs.

So the view is a JOIN, not an invention: instance state × diagram × the beans
and todos those steps name.

## "Where a process is breaking down" — what that means concretely

The interesting states are the ones that look like nothing:

- a step **enabled but not taken** for a long time,
- a bean marked blocked with **no expiry**, which `bean-blocking` already says
  cannot be told from abandoned work,
- an instance whose position has not moved while its bean kept changing,
- a gate that `workflow_complete` keeps refusing.

A visualiser that only draws the happy path will show a tidy diagram for a
process that has been stuck for a week.

## The second half, added by the owner and not to be dropped

**Working context/memory by DEPENDENCY TREE for the task, and the logs
associated with it.** Agent memory is a `context` graph (read at session start,
never written by a process) and `interaction/` is another; logs are their own.
So the view has to resolve, for a given task: which memory entries its
dependency chain makes relevant, and which log entries belong to it. That is a
different join from the diagram one and should be designed with it rather than
bolted on — the owner asked for both in the same breath.

## Done when

- [ ] For a running instance: the diagram, the current position, and the beans
      and todos its steps name, together.
- [ ] Stuck states are VISIBLE as states rather than inferred from a tidy
      picture — at minimum: enabled-and-not-taken, blocked-without-expiry, and
      a refused gate.
- [ ] For a task: the working context/memory its dependency tree implies, and
      its associated logs.
- [ ] It reads committed state only, so a sibling session's view agrees.

## Not started

Explicitly per the owner: *"do not do this, just bean up"*.
