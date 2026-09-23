---
layout: default
title: 'State in a running process'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/workflow/workflow-state.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/workflow/workflow-state.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/workflow/workflow-state.md){: .fa-edit-source }

{% raw %}
# State in a running process

A process instance is not self-contained. It walks a diagram that lives
somewhere else, records its position somewhere else again, and reads facts it
must not change. **Four stores, and confusing any two of them is how a work
plan comes to disagree with itself.**

## Which store answers which question

| question | store | graph kind | layer |
|---|---|---|---|
| what does this process DO? | `processes/*.bpmn` | `cat-harness` | **content** |
| where did this instance GET TO? | the workflow-state node of the bean graph | `workflow-state` | **state** |
| what is being worked on? | the bean-defs node of the bean graph | `bean-defs` | **state** |
| what does a PERSON still owe? | `todos/` | `todo-items` | **state** |
| what do I already know? | agent memory | `memory` | **context** |

The `layer` column is not decoration — it says **what a step may do**. A step
may write to a `state` graph; that is what state is for. **A step that writes
to `context` is a defect**, not an update: memory changes when a human directs
an authoring act, outside any instance.
[`content-context-and-state-graphs`](../folio-core/content-context-and-state-graphs.md)
carries the axis; `processMayWrite()` is the predicate.

## The diagram is content and the instance is state, and that is the whole model

A `.bpmn` is authored, reviewed, versioned and read by anyone — it stands on
its own. An instance is a **token position in that diagram** plus a history: it
means nothing detached from the file it walks. That is why the two live in
different graphs and why an instance names its process rather than embedding
it.

Two consequences worth stating, because both have been got wrong:

**An instance is never edited by hand.** It carries
`"$schema": "folio-workflow-instance/v1"` and the interpreter owns it. Hand-
editing a token is asserting a step happened, which is precisely what the gate
exists to refuse.

**A diagram change does not rewrite history.** An instance records where it got
to under the diagram as it stood. If a step is renamed, the honest answer is
that the old instance names a node that no longer exists — not that it
retroactively took a different path.

## Beans and instances are ONE answer, not two

`bean-defs` says *what is being worked on*; `workflow-state` says *where it got
to*. Those must be one answer or they diverge, and a work plan that disagrees
with itself is worse than one that is merely coarse.

The loop is closed by `<folio:bean op="…">` on an activity. **A bean-marked
step is not a step *about* the work plan — it IS the work-plan operation**, so
completing the step performs it:

| `op` | on completing the step |
|---|---|
| `claim` | status → `in-progress`, idempotent |
| `note` | append the caller's note to the body |
| `resolve` | status → `completed`, **only if the instance itself finished** |

**`resolve` is the careful one, and the care is the point.** A bean is never
closed on somebody else's judgement, so it does not fire on the caller's
say-so: the bean completes only when the instance tracking it has completed,
which is a fact *derived from the process* rather than asserted by the agent
calling it. A still-running instance gets a note.

An `op` the build does not implement **fails at process load**. A step that
says it resolves a bean and quietly does nothing is exactly the divergence the
extension exists to close.

## What state does NOT buy you

**Ordering is not quality.** A completed instance means the gates ran in order
and a person saw the findings. Whether the content is *correct* is what the QA
axes, the build and the validators are for. A green process must never be read
as a reviewed artefact, and any dashboard built on this has to say so.

**A position is not a claim.** An instance at `Task_Commit` says the token
arrived, not that the commit is good.

## Why the state is committed

The container is ephemeral and **a work plan only one agent can see is not a
work plan**. Instance state is committed for the same reason `beans/` is: a
sibling session, or the same session resumed in a fresh container, must find
the position that exists rather than starting a second one beside it.

Instance ids are **derived from the subject rather than random**, so re-entering
a step finds the instance that is already there. That is not a stylistic
preference: `beans create` is not idempotent and dedupes on nothing, which
produced 14,688 duplicates in one afternoon — 92 % of every open bean in that
repo. An id you can recompute is the fix, and it is cheap.

The trade-off, stated openly: this is churn in the diff, on every step. Beans
already carry that cost and the repository tolerates it.

## Reading the state you did not write

Before acting on an instance you did not start, ask what it is waiting on. A
bean's status defaults to **non-blocking**; a real block carries what it waits
on, since when, an **expiry** and a handoff — because a block with no expiry
cannot be told from abandoned work.
[`bean-blocking`](../folio-core/bean-blocking.md) carries that, and
[`bean-coordination`](../folio-core/bean-coordination.md) carries the rule that
a claim **announces rather than reserves** until your PR exists.

## See also

- [`bpmn-processes`](bpmn-processes.md) — how to author an activity, strict vs
  advisory, the commit-boundary gate, DMN-backed gateways.
- [`process-state`](process-state.md) — saying which process you are in, the
  five detectors for being out of process, and the recovery.
- [`content-context-and-state-graphs`](../folio-core/content-context-and-state-graphs.md)
  — the layer each store sits on, and why memory is not writable by a step.
- [`todo-manager`](../folio-core/todo-manager.md) — the work plan's own store.
  A todo is a **person's** outstanding item and is not a second work plan.
{% endraw %}
