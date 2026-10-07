---
# folio-assistant-3q47
title: 'PROCESS WALK: deterministically set an agent''s context from the KG at each task'
status: todo
type: task
created_at: 2026-09-19T17:04:01Z
updated_at: 2026-09-19T17:04:01Z
parent: folio-assistant-ahvw
---


**Uncaptured owner requirement**, same comment as `folio-assistant-cy4p` —
[#363](https://github.com/litlfred/folio-assistant/issues/363#issuecomment-5740727385),
09:20, not beaned until 17:0x.

> use for skill to deterministcally walk agent through process flow,
> detministitcally setting the memory/context using the KG
> (subprocess/role overlays). worktiems are the beans that they carry with
> them in a process at a task.

## What is being asked for, in this repository's own vocabulary

Three things the role model already names, joined into one mechanism:

- **deterministically walk** — the engine already refuses a step that is
  not enabled, so the walking is there. What is missing is the agent's
  CONTEXT being set by the walk rather than by whatever it happened to
  read.
- **memory/context from the KG, with subprocess/role overlays** — a lane
  binds a role, a role carries skills, and a subprocess stack is SCOPED
  (`role-model.md`: `inherits` is IS-A and static; the subprocess stack is
  scoped, and merging the two gives a closure too broad to fail an audit).
  So entering a subprocess should overlay context and LEAVING it should
  remove that overlay. The scoping is the whole point.
- **work items are the beans carried at a task** — `<folio:bean op>`
  already declares the operation a step performs. This extends it: the
  bean travels WITH the token.

## Why this is not just "load the skill"

`workflow_next` already returns the skill to run. The ask is stronger:
the context should be **determined by position in the process**, so two
agents at the same task in the same lane get the same context — which is
what makes the comparison in `folio-assistant-502c` meaningful at all.
Without determinism there is nothing to compare against.

## Done when

- [ ] entering and leaving a subprocess overlays and REMOVES context, and
      a test shows the overlay gone after the subprocess completes
- [ ] two runs at the same task under the same role produce the same
      context, asserted rather than observed
- [ ] the bean(s) carried at a task are part of that context
