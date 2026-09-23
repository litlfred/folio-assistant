---
# folio-assistant-76sa
title: 'ROOT README: the four pointers, driven by the KG rather than listed — bootstrap overview, skill query, active-vs-static, BPMN role/process'
status: completed
type: task
priority: normal
created_at: 2026-09-21T05:50:07Z
updated_at: 2026-09-21T06:26:04Z
parent: folio-assistant-zzmr
---


Carved out of `ie9l` when issue #592 was closed (2026-09-21, owner's word).
`ie9l`'s second `Done when` box, **partly** landed and recorded as partial
rather than ticked.

**What landed** (PR #593): the `cat-harness:instances` section — a generated
table of every instance, both entries per row, resolved from each instance's
own declaration. That is "by query rather than by list" for the INSTANCES.

**What did not**: the four pointers the owner asked for, which are a
different question from the instance table.

> • point to the bootstreap md overview of skill/tasks
> • point to kg-navation, instruct them where to find the list of skills in
>   materialed corpus (be careful to do this to minimize drift, maybe tool to
>   use json/jsonld queries for aaplicable KGs)
> • tell them to determine if active KG (beans/tods) or static (point to
>   process on determining context)
> • if active: see agent shoud can determine their role, process, task,
>   context/memoty (point to BPMN processes), then check for active beans and
>   (new/updated process) priotize and ask use which beans to work on

The drift constraint is the hard part and it is the owner's own: **the skill
list must be a QUERY, never an answer.** A README that lists skills is wrong
the day a skill is added. `_kg/<stub>.jsonld` is published per instance, so
the query surface exists; what does not exist is a tool that runs one, which
is what this needs and what `d308` is about.

**The active-vs-static distinction is not written down anywhere**, and `aazi`
needs the same definition for its status dashboard. The obvious reading —
*an instance is ACTIVE if it declares a `state` graph* (beans, todos,
workflow-state) — is already declared and checkable rather than a new flag.
**Both beans need it confirmed; neither should invent it separately.**

## Done when

[x] The root README carries the four pointers — generated section
    `cat-harness:cold-start`.
[x] The skill list is reached by a QUERY, not a list — the section names
    `skill_list` / `skill_fetch` and the no-MCP fallback, and says in the
    rendered text WHY it carries no list: a README is the one file no check
    reads.
[x] Active-vs-static is defined once, checkably, and `aazi` uses the same one
    — `recordsWork` on the graph kind, `workPlanGraphsIn` / `isActiveKg`
    deriving from it, `check:graph-kind-work` keeping every state kind
    decided.

## The definition, and why it is narrower than it first looked

**ACTIVE = some instance in the checkout declares a graph kind whose
`recordsWork` is true** — beans (the agent work plan), todos (a person's
outstanding work), a BPMN instance mid-flight.

The first cut read *"declares any `state` graph"* and was **measured wrong**:
it made the repository root and `who-iris` ACTIVE on `uploads` alone. An
ingestion queue is live state and is not work anybody is partway through, so
an agent told the graph was active would arrive looking for something to
prioritise and find a directory of unprocessed files.

**Asked of the REPOSITORY, not one instance.** The root declares no work-plan
graph; `cat-harness` declares `beans` and `todos` at `scope: "repository"`.
Asking per instance calls the one place a reader actually stands static.

**Derived, never listed.** `recordsWork` is a property of the KIND, so adding
a graph kind forces the decision there rather than requiring somebody to
remember a set here — which was this bean's own stated falsifier: a hardcoded
set is a list pretending to be a rule.

`recordsWork` is optional in the type because it is meaningless for
`content`, `context` and `derived`; the cannot-ship-undecided property lives
in `check:graph-kind-work`, narrowed to the layer where the question means
something.

## COULD NOT DETERMINE is a third state

`isActiveKg` returns `true | false | undefined`. The first draft caught an
unreadable declaration and skipped it, which rendered **STATIC** — telling an
arriving agent there is no work here when nobody had been able to look. That
is the failure this repository keeps paying for, committed by the function
written to answer the question. It now reports the unreadable declaration and
the section leaves its region untouched.

## `aazi` uses this

`aazi`'s status dashboard needs the same active-vs-static distinction and
`ie9l` said neither bean should invent it separately. It is `isActiveKg`.

## Summary of Changes

`recordsWork` added to `GraphKindDef` and decided on all 11 `state` kinds;
`workPlanGraphsIn` / `isActiveKg` / `undecidedWorkKinds` in
`schemas/cat-harness.ts`; `check:graph-kind-work` wired into
`code-quality-gates.yml`; `cat-harness:cold-start` generated section plus its
marker pair in the root README. 13 tests. `bun run gates --all`: 81 of 81.
