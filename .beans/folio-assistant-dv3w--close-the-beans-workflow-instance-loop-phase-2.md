---
# folio-assistant-dv3w
title: Close the beans <-> workflow-instance loop (phase 2)
status: completed
type: task
priority: normal
created_at: 2026-08-26T15:29:15Z
updated_at: 2026-08-26T15:55:00Z
---

Follow-up to fq0b. .beans/ answers 'what is being worked on'; a workflow instance answers 'where did it get to'. Those must be one answer or they will diverge. Hooks exist already: workflow_start takes a bean, and 11 activities carry <folio:bean/>. What is missing is the loop closing — completing a bean-marked activity updates the bean, and work_plan_prime reports instance position beside bean status. Small, and independent of the gating decision. See docs/proposals/workflow-orchestration.md §5.

## Summary of Changes

The loop is closed. A bean-marked activity is not a step *about* the work plan,
it **is** the work-plan operation, so `<folio:bean/>` gained an `op` and
completing the step performs it on the instance's bean:

    claim    status -> in-progress, idempotent          5 activities
    note     append the caller's note to the body       4 activities
    resolve  status -> completed, IF the instance ended 2 activities

`resolve` is the one that deliberately refuses to fire. AGENTS.md is explicit
that a bean is not closed on someone else's judgement, and the activity is
called "Resolve **or re-open** the bean". So it does not act on the caller's
say-so: the bean completes only when the instance it tracks has itself
completed — a fact derived from the process rather than an assertion. A
still-running instance gets a note and says why.

`work_plan_prime` now joins the two views: every instance is reported with its
position and its bean, and the *absence* of a bean is stated rather than left
blank, because silence is how two records drift apart unnoticed.

Verified end to end through the MCP tools against a temp repo: bean `todo` →
`in-progress` on `Task_ClaimBean`, note appended on `Task_LogFindings`,
`in-progress` → `completed` on `Task_ResolveBean`, and the join reporting both.

## Two things worth knowing

- **The CLI is preferred, a direct `.beans/*.md` rewrite is the fallback.**
  "beans CLI not on PATH" is this repo's own session-start message; an
  integration that only worked with the CLI installed would be off exactly when
  someone picks up a fresh container. The fallback is what the tests exercise.
- **`findBean` matches `<id>--`, not the bare id**, so `fq0b` cannot also
  resolve a bean called `fq0bx`.

An `op` this build does not implement fails at process *load*. A step that says
it resolves a bean and quietly does nothing is precisely the divergence this
extension exists to close.

## Unrelated fix carried in the same change

A modeller round-trip (`fromXML` then `toXML`, what Camunda Modeler does on
save) **strips XML comments** — verified — while preserving `folio:` extensions
exactly (10/10 skill, 3/3 bean) and `bpmn:documentation` (26/26). The guidance
in each `.bpmn` header ("this file is the source of truth, regenerate the SVG
with `render:bpmn`") therefore would have vanished the first time anyone edited
in a modeller. Moved into `<bpmn:documentation>` on the process element, which
survives. All six SVGs still render byte-identically.
