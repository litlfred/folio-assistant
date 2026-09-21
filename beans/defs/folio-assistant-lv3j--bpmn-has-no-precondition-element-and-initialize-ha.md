---
# folio-assistant-lv3j
title: BPMN has no precondition element, and initialize-harness needs one
status: completed
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

- [x] a precondition has a declared home in the process schema, not only in
      documentation prose
- [x] the schema distinguishes a checkable precondition from a stated one, and
      an unverifiable one is reported rather than assumed
- [ ] `initialize-harness` carries its precondition in that form


## Summary of Changes — 2026-09-21

`<folio:precondition>` on the `<bpmn:process>`, parsed in `process-model.ts`
alongside `folio:policy` and `folio:log`.

### Where — on the process, and the bean's own reasoning settled it

*"A start event is the closest BPMN idiom but conflates 'may start' with 'is
ready'."* That is right, so it sits on the process.

### The bean's checkable example was wrong, and getting it right IS the design

The bean offers *"this file was read"* as the checkable case. **It is not.**
The engine can check a file EXISTS; whether an actor READ it is not observable
from here, and a check claiming otherwise is precisely the green tick over an
unverified claim this element exists to prevent — not one it may commit on the
way in.

So the line is drawn where observability actually falls:

| kind | claim about | verdict |
|---|---|---|
| `checkable` | the WORLD | `satisfied` / `unsatisfied` |
| `stated` | the ACTOR | **always** `could-not-determine` |

`evaluatePrecondition` returns on `stated` on its FIRST line, before anything
else is consulted, so there is no path on which a claim about the actor comes
back satisfied. That is structural rather than a rule somebody must keep
remembering — it holds for a model nobody parsed, which a test asserts by
hand-building a `stated` precondition carrying a check.

### Nine refusals, because a wrong declaration is worse than prose

Prose is honestly unchecked; a wrong declaration is dishonestly checked. So
the parser throws on: no `kind` (**no default** — defaulting either way lets
an author who meant to check something forget), a `kind` that is neither,
`checkable` with no check, an unimplemented check, `checkable` with no `ref`,
`stated` carrying a check, no `id`, no `text`, and two sharing an `id`.

### initialize-harness

The one prose sentence became four declarations — three `stated`, one
`checkable` — and the count is now visible rather than buried:

```
could-not-determine   stated     knows-the-vocabulary
could-not-determine   stated     told-it-is-an-initiator
could-not-determine   stated     at-the-start
satisfied             checkable  readme-present
```

Loaded BY PATH in the test, because no corpus sweep covers
`bootstrap/workflows/` — the platform scans `cat-harness/skills/workflows/`
only, which is the `pve3` asymmetry. Without that the element could have
shipped and the one diagram needing it been left behind.

### A vacuous green, caught by falsifying

The first version of the unknown-check refusal test passed **with that branch
disabled**: it omitted `ref`, so the no-ref guard rejected it first and the
branch under test was never reached. A refusal test has to leave exactly one
reason to refuse. Fixed, and both falsifications now turn tests red.

## Not in scope

Wiring preconditions into gate ENFORCEMENT. This declares and reports; making
one BLOCK a step is a decision about behaviour, and `could-not-determine` is
the majority verdict here — a gate that blocks on it would stop the only
process an Initiator can start.
