---
# folio-assistant-mhh9
title: 'ANALYSIS: are agent Memories KG-State or KG-Content?'
status: completed
type: task
priority: normal
created_at: 2026-09-20T05:04:19Z
updated_at: 2026-09-20T05:44:30Z
parent: folio-assistant-8jt6
---

Open question raised by the owner 2026-09-20, and **settled by the owner the
same day**:

> put memory under state/context as static, during a process. it does not
> change. agents dont work on it (except when an authoring agent is directed by
> human). todos, beans are not static

## The ruling, and what it changed about the axis

**Agent memory is `context`** — and `context` did not exist until this bean was
answered. The two-value axis (`content` / `state`) could not express it: a bean,
which a step rewrites, and a memory entry, which no step may touch, were both
"state", so a consumer told only that could not tell whether **writing to it was
normal or a bug**.

So the axis is three-way now, and one question settles every kind: **does a
running process WRITE it, READ it, or is it the SUBJECT?**

## The evidence measured before the ruling, and how it landed

`todos/todos.json` states a 2x2 — memory vs workflow management, human vs agent
— putting `todos/` and agent memory in the same *memory* row. That row is
exactly where the ruling cuts: a todo is an **outstanding item a process
closes** (live `state`), a memory entry is an **established fact nothing
mid-process revises** (`context`). Same row, opposite layers. Neither model is
wrong; they answer different questions, and a reader assuming they align will
expect memory to behave like a todo.

`fsh-guts` moved by the same criterion, and it was not foreseen: nothing mid-
process writes it either, and relocating something there is a human-directed
act — which is what `deletion-requires-confirmation` already said in as many
words. It was `state` for the few hours between the axis landing and this bean
being settled.

## Summary of Changes

- `GraphLayer` gains `context`; `memory` registered as a kind, `holds:
  "context"`; `fsh-guts` reclassified.
- `isContextGraph()`, and `processMayWrite()` — the question `isStateGraph` was
  usually being asked in service of. `isStateGraph` **narrowed**: it answered
  for every non-content kind before, so a caller asking "may a step write this"
  got `true` for a memory entry.
- The skill renamed to `content-context-and-state-graphs.md` and rewritten
  around the one question, with this ruling quoted in it.
- Two PRE-EXISTING tests fixed on the way: both enumerated every base kind by
  name while claiming to test something else ("contains no renderable kind",
  "does not know folio"), so adding `memory` broke them on the change that was
  correct and the failure said "the list differs". Both now assert the property
  they name.
- `directory-conventions.md`'s table column renamed `holds` -> `contents`:
  `holds` is now a FIELD meaning the layer, and one word meaning two things in
  one document is a collision worth a rename. The layer is deliberately NOT a
  column — a hand-maintained copy would drift from the registry that decides it.

## What is NOT done, deliberately

The 36 nodes have not moved. `skills/memory/` is inside `skills/`, declared
`cat-harness`, and a nested declaration is the defect #263 names — so the fix is
a relocation to a declared `memory/`, which is **bean `07xs`**. Relocating a
directory as a side effect of adding a classification is the shape #395 refused
and bean `auap` did as its own change.
