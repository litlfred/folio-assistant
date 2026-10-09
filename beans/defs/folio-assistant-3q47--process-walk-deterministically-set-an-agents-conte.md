---
# folio-assistant-3q47
title: 'PROCESS WALK: deterministically set an agent''s context from the KG at each task'
status: completed
type: task
created_at: 2026-09-19T17:04:01Z
updated_at: 2026-10-09T20:15:00Z
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

- [x] entering and leaving a subprocess overlays and REMOVES context, and
      a test shows the overlay gone after the subprocess completes
- [x] two runs at the same task under the same role produce the same
      context, asserted rather than observed
- [x] the bean(s) carried at a task are part of that context

## Closed 2026-10-09

- **Branch**: `claude/3q47-process-walk-context`
- **Commit**: `92ce3e14`
- **Changes**:
  - `src/workflow/instance.ts`: Added `TaskContext` and `StepNext` type export; enriched `EnabledActivity` and `EnabledDecision` with deterministic `context` snapshot containing `role`, `roleStack`, `effectiveSkills`, `conventions`, and `carriedBeans`.
  - Implemented subprocess scope overlays for roles and conventions along call paths when tokens enter call activities.
  - Ensured complete removal of subprocess context overlays upon subprocess completion when execution returns to parent flow.
  - Implemented token-carried beans tracking through `InstanceState.carriedBeans`, instance tracking (`bean`), and BPMN `<folio:bean>` element declarations (`ref`/`id`/`bean`), with propagation across subprocess calls and completions.
  - `src/workflow/process-model.ts`: Extended `ProcessNode` and `readWorkPlanOp` to parse and accept bean references (`ref`, `id`, `bean`) alongside `op`.
  - `src/workflow/instance.test.ts` & `test/workflow/process-walk.test.ts`: Added comprehensive unit tests verifying subprocess entry/exit overlay additions and complete removals, identical deterministic context between independent runs, and carried bean propagation.
- **Verification Evidence**:
  - `bun test test/workflow/`: 3 passed, 0 failed (108ms)
  - `bun test src/workflow/`: 3 passed, 0 failed (105ms)
  - `bun test scripts/tests/workflow-*.test.ts`: 96 passed, 0 failed
  - `bun run typecheck`: clean TypeScript validation (exit code 0)
