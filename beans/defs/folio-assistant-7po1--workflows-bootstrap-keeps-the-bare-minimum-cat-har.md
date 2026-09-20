---
# folio-assistant-7po1
title: 'WORKFLOWS: bootstrap keeps the bare minimum, cat-harness/workflows elaborates, and workflows/state owns beans+todos'
status: todo
type: task
created_at: 2026-09-20T13:18:23Z
updated_at: 2026-09-20T13:18:23Z
parent: folio-assistant-zzmr
---


Owner, 2026-09-20, verbatim — three separate instructions in one message:

> workflows/ is declared under the id cat-harness-workflows, content should be
> at graph cat-harness/workflows except the bare minimum declarations (what is
> bpmn, how use) under bootstrap/,
> cat-harness/workflows is for more elboration on use of bpmn and such
> cat-harness/workflows/state should describe beans and todos skills and declare
> todos/ beans/ do create on its initalization process. state manament skills
> and tools go here

## What is true today, measured

- `bootstrap/harness.json` declares `workflows/` under the id
  **`cat-harness-workflows`** (renamed from `workflows`; the rename is why
  `harness:dirs:check` now reports `20 declared, 0 missing` rather than the
  `21 / 1 missing` still written into `cat-harness/harness.json`).
- It holds `initialize-harness.bpmn` and `log-message.bpmn` — its own
  description calls these "the bootstrap PROCESSES".
- `cat-harness` declares no `workflows/` entry of its own. The platform's
  diagrams live at `cat-harness/skills/workflows/`, which is inside the `kg`
  graph rather than a graph of its own.

## The three asks

1. **Split the BPMN material by depth.** `bootstrap/` keeps only what an agent
   needs before it knows anything — what BPMN is, how to read one. Everything
   elaborating on *using* BPMN moves to `cat-harness/workflows`.
2. **`cat-harness/workflows/state`** describes the beans and todos skills, and
   is where state-management skills and tools live.
3. **It DECLARES `todos/` and `beans/` and creates them on its initialization
   process.** This is the part that overlaps live code — see below.

## Overlap with `qmjh`, which is now built

`qmjh` added `dependents: "reproduce" | "skip"`, and `beans` and `todos` are
both classified **`reproduce`**. That classification is currently inert: both
are `scope: "repository"`, and `resolveDirectories` never inherits a
repository-scoped entry, so nothing downstream reaches them.

If `workflows/state` becomes the thing that declares and creates them, then
**who owns those two entries moves**, and the `reproduce` classification stops
being inert. Do not re-litigate the classification as part of the move — it is
already the right answer for the case where it starts firing. What needs
deciding is whether the declaration moves out of `cat-harness/harness.json`
entirely, or `workflows/state` names them and the declaration stays.

## Open questions, the owner's

- Is `cat-harness/workflows` a NEW declared directory and graph, or the existing
  `skills/workflows/` renamed? The phrase "content should be at graph
  cat-harness/workflows" reads like a graph id, and there is already a graph
  kind called `cat-harness`.
- Does `workflows/state` "declaring" beans and todos mean a `harness.json`
  entry, or a BPMN process with `<folio:bean>` steps that creates them?
- Does this make `bootstrap/` smaller than its two current diagrams, i.e. does
  `log-message.bpmn` stay?

## Depends on / relates to

`603s` (the per-instance navbar renders each instance's declared subgraphs, so
a new `cat-harness/workflows` graph would appear there) and `qmjh` (above).

## Not started

Queued per the owner's standing instruction to queue rather than pivot.
