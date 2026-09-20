---
# folio-assistant-hb2o
title: 'PROCESS: actor and role administration is undrawn — role-management is exercised by nothing'
status: completed
type: task
priority: normal
created_at: 2026-09-20T03:12:36Z
updated_at: 2026-09-20T04:08:49Z
parent: folio-assistant-ahvw
---


**From the owner, 2026-09-20:** *"for actor roles similarly propose missing
proccses invlving the actors"*.

## The join is clean — this is not a dangling-reference bug

Measured 2026-09-20 across 26 actors, 31 roles, 34 diagrams:

| check | result |
|---|---|
| declared roles bound to at least one lane | 31 of 31 |
| actors naming a role that does not exist | 0 |
| actors whose every role is unbound | 0 |
| lanes binding no role | 0 |
| actors with no roles | 1 — `viewer` |

`viewer` is NOT a gap: *"Takes on no role: it never appears in a swimlane,
which is why `roles` is empty rather than absent."* A determined empty.

## What is missing

`admin` holds two permissions no other actor has — `role-management` and
`admin-settings` — and:

- no diagram mentions role assignment, permission granting or actor
  onboarding;
- no lane anywhere is named for admin or governance;
- `admin` DOES appear in 17 diagrams — as programme-manager,
  publication-manager, editor, author, reviewer, code-reviewer.

**The one thing that actor uniquely IS, is the one thing never drawn.**

## Why structural rather than an oversight

Permissions cross-cut lanes, so most are exercised inside one and need no
diagram. `role-management` is different: exercising it CHANGES THE ROLE
GRAPH — the thing every other diagram's lanes bind to. A process edits the
substrate, and it is undrawn and ungated.

## The diagram, and the question it forces

`actor-role-administration.bpmn`, sitting above the others:

| activity | why it needs drawing |
|---|---|
| add an actor, declare its kind | agentic-vs-mechanical is judgement (`role-model.md`) |
| assign roles to an actor | the join every other diagram depends on |
| grant or revoke a permission | cross-cuts every lane; no gate today |
| retire an actor | `deletion-requires-confirmation` has no process here |
| audit after a change | `kg:audit` exists; nothing says WHEN to run it |

**BLOCKED on a vocabulary decision that is the owner's:** there is no
`admin` ROLE, only an `admin` ACTOR. Drawing the lane means deciding whether
administration is a swimlane at all. Do not invent the role to make the
diagram drawable — that is the closure-widening failure `role-model.md`
records.

## Also thin, though connected

Four actors reach exactly one diagram each: `evidence-agent`,
`ig-publisher-service`, `lean-mcp`, `translator`. Not broken — each has a
single picture of itself and no view in another context. Worth a look, not
a fix.

## Done when

- [ ] whether administration is a swimlane role is decided and written down
- [ ] a process exists whose lanes read `role-management`, or it is recorded
      why administration is a reviewed filesystem edit instead
