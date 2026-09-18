---
# folio-assistant-fq0b
title: 'BPMN workflow orchestration: phase-1 interpreter + MCP tools, and the proposal'
status: completed
type: task
priority: normal
created_at: 2026-08-26T15:19:00Z
updated_at: 2026-08-26T15:28:53Z
---

The agentic workflows are ad hoc: skills are documents an agent is trusted to
follow, and nothing connects them to the BPMN processes now in docs/workflows/.
Ask: can workflow execution be made more deterministic, via MCP?

Building phase 1 first so the proposal is decided on measurements rather than
on "a few hundred lines" — the shape rag-document-ingestion.md set.

## Todo

- [x] Parse the .bpmn into a process graph (bpmn-moddle, already vendored)
- [x] Token interpreter: start / enabled / complete, refusing unsupported BPMN
      loudly rather than ignoring it
- [x] Persist instance state where humans and sibling agents can see it
- [x] MCP tools: workflow_start / workflow_next / workflow_complete / workflow_state
- [x] Tests, including that the HCI gate cannot be skipped
- [x] Measure: LOC, parse cost, coverage of the 6 real diagrams
- [x] docs/proposals/workflow-orchestration.md on those numbers

## Summary of Changes

Phase 1 built and landed, and the proposal written on its measurements rather
than on an estimate — the shape `rag-document-ingestion.md` set.

**The interpreter** (`src/workflow/`): `process-model.ts` reads a `.bpmn` with
`bpmn-moddle` (already vendored under `bpmn-js`, now a direct dependency) into
a graph carrying lanes, `folio:skill` refs and `folio:bean` marks;
`instance.ts` walks it as a token machine; `store.ts` persists instances under
`.folio/workflow/`, committed, with ids derived from the subject so re-entering
a step finds the instance rather than minting a second.

**Four MCP tools** registered beside `work_plan_prime`: `workflow_list`,
`workflow_start`, `workflow_next`, `workflow_complete`.

**Measured**, across all six shipped diagrams:

    547 non-comment lines · parse 11–32 ms per diagram
    60 activities · 56 carry a skill ref (93%) · 11 touch the work plan
    10 decision points · 3 call activities · 20 distinct skills
    every node reachable from a start, and able to reach an end

I had guessed "a few hundred lines" when recommending this. It is 547 — the
right order, but the guess was low, and saying so is cheaper than letting the
next estimate inherit the optimism.

**Seventeen tests against the real `.bpmn` files**, not fixtures. The load-
bearing one: `workflow_complete { node: "Task_Commit" }` on a fresh instance
refuses with *"not enabled … Enabled now: Task_DescribeChange"*. Also pinned —
both validation branches must report before the join fires, `discard`
terminates without ever enabling the commit, `revise` re-enables the mechanical
checks rather than letting round two skip them, and unsupported BPMN throws
naming itself rather than being silently walked past.

**What phase 1 deliberately does not do:** bind anything. An agent can still
call `content_validate` directly. Making it binding is the decision
`docs/proposals/workflow-orchestration.md` §4 asks for, and the proposal
recommends the **commit boundary** over tool-by-tool gating — one place rather
than twenty-five, and enforced by something other than an agent's intention to
call it.

## Follow-ups worth their own beans

- Phase 2: close the beans ↔ instance loop, so the two do not become separate
  truths. Small, and independent of the §4 decision.
- DMN tables for the four mechanical gateways (`Build green, no sorries?`,
  `Draft QA green?`, `QC clean?`, `FHIR valid?`). Highest determinism per unit
  of work, and it uses the `dmn-authoring` skill the repo already ships.
- The §4 gating decision itself.
