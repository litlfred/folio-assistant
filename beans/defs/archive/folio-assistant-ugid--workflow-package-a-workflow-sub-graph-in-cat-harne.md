---
# folio-assistant-ugid
title: 'WORKFLOW PACKAGE: a workflow/ sub-graph in cat-harness gathering the BPMN skills and the engine as a Tool'
status: completed
type: feature
priority: high
created_at: 2026-09-20T05:04:19Z
updated_at: 2026-09-20T06:34:03Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-20:

> just like there is a kg-navigation sub-graph there, there should be a
> workflow/ sub-graph which brings together skills/tools around bpmn navigation
> and workflow management, expectation on use of beans and todos to reference
> state

## A correction to this bean's own opening claim

It said the engine "is declared as a Tool **nowhere** — it is code nothing in
the graph points at." **That was wrong.** All five are declared:
`workflow-list`, `workflow-start`, `workflow-next`, `workflow-gate`,
`workflow-complete`, in `cat-harness/tools/mcp.ts`, each satisfying
`process-state` and two also `bean-coordination`. Measured before writing
anything, because the claim decided what this bean was for.

So `ugid` is a GATHERING job, not a declaring one — and what was actually
missing turned out to be different and better.

## What was actually missing

**`folio-core` holds 97 skills.** A package that holds everything is one
nobody can be pointed at, and that is what made a `workflow/` package a real
split rather than re-homing for its own sake.

**Nothing said which store answers which question.** The pieces were spread
across `bpmn-processes`, `process-state`, `bean-coordination`, `todo-manager`
and `bean-blocking`, and the one thing the owner asked for — the expectation
about beans and todos referencing state — was in none of them. It is now
`workflow-state`, and it can be stated crisply because `mhh9` settled the
layer axis first: a step may write to `state`, and a step that writes to
`context` is a defect.

## Summary of Changes

- `skills/workflow/` — `bpmn-processes` and `process-state` moved in (measured
  first: 1 inbound markdown link each, 0 `folio:skill ref`s, 0 role
  references, since refs resolve by NAME), plus the new `workflow-state`.
- `workflow-state` carries the store table with each store's graph kind and
  layer, why the diagram is content and the instance is state, what
  `<folio:bean op>` actually performs and why `resolve` derives from the
  instance rather than the caller, what ordering does NOT buy, and why ids are
  derived rather than random.
- The `workflow-state` GRAPH KIND now names that skill in its `skill` field,
  which was empty because the skill did not exist. A consumer arriving at the
  kind had the shape and no account of what a token position means.
- `AGENTS.md` pointers follow the move, and its BPMN bullet now says all five
  tools are declared Tool nodes.
- `workflow`'s manifest declares `aptPackages: []` — required by the schema,
  and an empty list is the honest value: "needs nothing installed" is a fact,
  distinguishable from a manifest that forgot to say. Same reasoning as
  `install.none` on a Tool.

## What this did NOT do

`bean-coordination` and `todo-manager` stay in `folio-core`: they are the work
plan, which a process REFERENCES rather than owns, and both are heavily
entangled (4 and 29 `folio:skill ref`s, 2 and 3 role references). `workflow`
states the expectation about them and points; it does not absorb them.

`bpmn-authoring` and `dmn-authoring` sit in a CONTENT-TYPE package and are
generic — bean `3g13`, with the measurement and the blocker that stopped the
move.

## Done when

- [x] a `workflow/` package exists with its own manifest
- [x] the BPMN/process skills gathered into it, links repaired
- [x] the beans/todos-reference-state expectation stated in a skill
- [x] the `workflow-state` kind names its reader
- [x] 42 gates pass
