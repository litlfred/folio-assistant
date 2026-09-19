---
layout: default
title: Bean Coordination
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/bean-coordination.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/bean-coordination.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/bean-coordination.md){: .fa-edit-source }

{% raw %}
# Bean Coordination

The **bean-based work-plan system** — the [`beans`](https://github.com/hmans/beans)
CLI, a flat-file issue tracker storing issues as markdown under `beans/` — is
how every session tracks its work-plan and how agents hand off across sessions.

## A bean is never deleted

`beans delete` exists in the CLI. **Do not use it — not on a sibling's bean,
and not on your own.**

Work that turns out not to be wanted is **scrapped**: `status: scrapped`, with
a section saying why. That is also what "disable" means here; the CLI's status
vocabulary is `draft`, `todo`, `in-progress`, `completed`, `scrapped`, and
there is no disabled state.

The reason is not tidiness. A scrapped bean records that something was
considered and rejected, and on what grounds — which is what stops the next
agent re-entering the same dead end. A deleted bean leaves a sibling session
unable to tell abandonment from accident.

**Claiming and closing are separately scoped.** Claim before you work, so two
sessions do not pick the same item. Never *resolve* a bean another session or
a human owns — closing someone else's is how one of them loses work it had not
finished reporting.

Full cycle, as a diagram: [Beans and todos](https://litlfred.github.io/folio-assistant/beans-and-todos.html).

**Operational spec (read these):**

- [`todo-manager.md`](todo-manager.md) — bean lifecycle: `beans create` /
  `update` / `list`, parent/child epics, status transitions. This is the
  authoritative *local* usage spec.
- [`session-intent.md`](session-intent.md) — session-start intent + session-end
  results protocol against the master ledger and the bean queue.
- [`pending-show.md`](pending-show.md) — read-only "what is this session
  working on?" display.
- [`idle-backlog.md`](idle-backlog.md) — pull right-scoped beans while idle.

**Install the CLI:** [`scripts/install-beans.sh`](../../../scripts/install-beans.sh)
(idempotent; `go install github.com/hmans/beans@latest`).

> **Ownership note.** The *generic* coordinator/orchestrator bean-coordination
> logic is maintained in the `folio-assistant` platform and synced into
> consuming projects. Project-specific overrides should sit alongside, not
> replace, this canonical version.

## Disambiguation (do not conflate)

- **beans** = the agent's *session work-plan* (`beans/`, this skill).
- **sidecars** (`*.qa.json`, `*.witness.json`) = *content state tracking*.
  Beans ≠ sidecars. Do **not** convert QA / witness queue items into individual
  beans (see todo-manager.md disambiguation block).
{% endraw %}
