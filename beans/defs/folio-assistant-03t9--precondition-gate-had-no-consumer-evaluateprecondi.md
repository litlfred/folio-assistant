---
# folio-assistant-03t9
title: 'PRECONDITION GATE HAD NO CONSUMER: evaluatePreconditions had 0 non-test callers — workflow_start now asks'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-22T08:34:13Z
updated_at: 2026-09-22T08:55:04Z
parent: folio-assistant-ahvw
---

Issue #853 requirement 3, and the `a58y` shape in the component that requirement
would otherwise have been built on.

## Measured before anything was written

`<folio:precondition>` (bean `lv3j`) has been parsed, three-valued and tested
since it landed. Measured 2026-09-22:

| | |
|---|---|
| processes declaring a precondition | 1 (`bootstrap/processes/initialize-harness.bpmn`) |
| preconditions declared | 4 — 3 `stated`, 1 `checkable` |
| **non-test callers of `evaluatePreconditions`** | **0** |

`workflow_start` created the instance without ever asking. So the repository
carried a declaration that reads as a control and enforced nothing — exactly
`a58y`'s finding about the `qa-reporting` permission, in the component a
pre-execution gate would be built on top of.

That is why the consumer came BEFORE extending the check to Tool nodes.
Extending an unconsulted check to 69 more subjects widens the silence, not the
coverage.

## What landed

`src/workflow/preflight.ts` — `preflight`, `preflightRefusal`,
`describePreflight`. `workflow_start` calls it before `startInstance`.

The three verdicts do three different things, and the middle one is the point:

| verdict | effect |
|---|---|
| `unsatisfied` | **refused**, each offender named by id and quoted |
| `could-not-determine` | started, and NAMED in the output |
| `satisfied` | started, counted |

Blocking on `could-not-determine` would make `initialize-harness` unstartable —
3 of its 4 preconditions are `stated`, and `evaluatePrecondition` returns
`could-not-determine` for every one of them on its first line. That is not a
gate, it is an outage. Reading them as satisfied is the `dh4f` shape.

`describePreflight` has no silent output: a process declaring none says so in
those words, because a caller that has to look elsewhere to find out whether a
gate ran does not have one it can rely on.

## Why the gate is a module and not four lines in the handler

`mcp-graph-tools.test.ts` records what happens to logic living in a closure
inside a request handler: *"the wiring between a declared tool and its
implementation was covered by `tsc` and nothing else"* — and both defects in
that work typechecked cleanly. A gate whose only proof of life is that it
compiles is the defect it exists to catch.

So `precondition-consumer.test.ts` drives the REGISTERED handler through a stub
server, which is the property the Done-when asked for: a unit test of
`preflight()` stays green in exactly the world the gate is not consulted.

## Falsified before it was trusted

| break | result |
|---|---|
| `preflight` call removed from `workflow_start` | 4 pass, **1 fail** |
| `could-not-determine` folded into `unsatisfied` | 3 pass, **2 fail** |
| restored | **5 pass, 0 fail** |

One near-miss worth recording: the first draft asserted only on the
precondition's id, and passed against a MALFORMED fixture whose parse error
also quoted that id — green because the diagram would not load, which is the
opposite of the property. The assertion now matches the refusal's own wording.

`bun run gates` — 110 of 110.

## Done when

- [x] `evaluatePreconditions` has a non-test caller
- [x] A test that fails when the consumer stops consulting it, driving the
      registered handler rather than the function
- [x] The third state is preserved through the gate, and falsified
- [x] `workflow_gate` / `workflow_complete` deliberately NOT gated — recorded
      here rather than left as an unexplained absence: a precondition is what
      must hold before the start event, and re-asking mid-run answers a
      different question
