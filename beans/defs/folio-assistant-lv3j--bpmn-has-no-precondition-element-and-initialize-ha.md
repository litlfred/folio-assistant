---
# folio-assistant-lv3j
title: BPMN has no precondition element, and initialize-harness needs one
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:02:49Z
updated_at: 2026-09-20T04:03:21Z
parent: folio-assistant-vke6
---

## The gap

`initialize-harness` has a precondition the owner stated explicitly:

> The Initiator understands tasks, roles, processes, actors and skills; it has
> been told it is an Initiator; and it is at the start of this process.

**BPMN has no precondition element, and this repository's schema adds none.**
So it is written into `<bpmn:documentation>` on the process — prose an engine
cannot check, in a repository whose whole discipline is that a rule with no
mechanical half is a rule nobody enforces.

## Why it matters more here than elsewhere

Every other process in this repository runs inside a harness that has already
established who the actor is. `initialize-harness` runs **before** one exists,
so "you are an Initiator, and you know what a role is" is not something the
engine established — it is something the README asserted and nothing verified.
An agent that arrives at the start event without it fails in the confusing way:
it reads the lanes, does not know what a lane is, and improvises.

## What to work out

- **Where does it belong** — on the `<bpmn:process>`, on the start event, or
  as a declared property beside the diagram? A start event is the closest BPMN
  idiom (a condition on the trigger) but conflates "may start" with "is ready".
- **What can actually be checked?** "Understands what a role is" is not
  machine-checkable and pretending otherwise produces a green check over a
  claim nobody verified. A precondition that resolves to *"this file was
  read"* is checkable; one that resolves to *"this agent understood it"* is
  not, and the schema should refuse the second rather than accept it as prose.
- **Third state.** An unverifiable precondition must read as
  **could-not-determine**, never as satisfied.

## Done when

- [ ] a precondition has a declared home in the process schema, not only in
      documentation prose
- [ ] the schema distinguishes a checkable precondition from a stated one, and
      an unverifiable one is reported rather than assumed
- [ ] `initialize-harness` carries its precondition in that form
