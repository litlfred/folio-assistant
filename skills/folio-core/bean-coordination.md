---
name: bean-coordination
roles: [reader, collaborator, owner]
description: >
  Pointer to the bean-based session work-plan system (the `beans` CLI
  flat-file issue tracker, data under `.beans/`). Operational usage lives in
  todo-manager.md / session-intent.md; the generic coordinator/orchestrator
  logic is owned by the folio-assistant platform.
---

# Bean Coordination

The **bean-based work-plan system** — the [`beans`](https://github.com/hmans/beans)
CLI, a flat-file issue tracker storing issues as markdown under `.beans/` — is
how every session tracks its work-plan and how agents hand off across sessions.

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

- **beans** = the agent's *session work-plan* (`.beans/`, this skill).
- **sidecars** (`*.qa.json`, `*.witness.json`) = *content state tracking*.
  Beans ≠ sidecars. Do **not** convert QA / witness queue items into individual
  beans (see todo-manager.md disambiguation block).
