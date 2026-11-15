---
# folio-assistant-750a
$schema: bean/1.0.0
title: 'Work-state kinds have no viewer: bean defs, bean notes, workflow state, memory, sweep marks, boards, merge queue, surveys, todo feedback/items, interaction'
status: completed
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-21T17:27:00Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

Measured live: Bean definitions ×3, Bean notes ×3, Workflow state ×3, Memory ×2, Sweep marks ×1, Boards ×1, Board positions ×1, Merge queue ×1, Session surveys ×1, Todo feedback ×1, Todo items ×1, Interaction ×1.

Several are parts of a graph that already has a viewer (bean defs and notes are inside Beans; workflow state is the BPMN instances the Processes viewer could show). Those may be better nested under their parent viewer, or exempted as internal, than given their own.
## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".

## Landed 2026-10-15 (partial)

cat-harness-tools#351 + cat-harness#295; index re-pinned folio-assistant#2580. bean-defs, bean-notes, workflow-state: 5 -> 0 each. OPEN: memory (4 rows) — no viewer exists; it is a context graph the state-viewer does not draw, and renderExemption is per-instance. Needs an owner decision: build a memory viewer, add a per-kind 'by design' exemption, or leave.

_2026-10-20T12:20:00Z_: Memory is closed. cat-harness#302 (the state-viewer `memory` visualiser) went live with folio-assistant#2600 (958337b; gh-pages 9ef0feb). On the live rail, Memory (C@T Harness, Folio Assistant Core), Interaction and Waivers now link to `/en/cat-harness/memory/<instance>/`. Still "no viewer yet" here: Board positions, Boards, Merge queue (reuse the merge-queue section of cat-harness-tools#447 / cat-harness#364, bean 30jr), Session surveys, Sweep marks, Todo feedback, Todo items. The owner rules that every kind gets a viewer (2026-10-20 09:43Z). Optional follow-up: type filter chips and a `createdAt` column on the memory page. (https://claude.ai/code/session_01LM4btvYuBEuq57QqgwCrtu)

## 2026-10-20 — the last six kinds drawn (drain coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

Tools half in litlfred/cat-harness-tools#469 (state-visualizer: Session surveys + Sweep marks on `beans/<instance>/`; Feedback + Boards on the todos page; todo-items were already drawn), declaration half in a new cat-harness PR (coversKinds on todos/beans, state-viewer renders). Merge tools first. Composed index: no "no viewer yet" left for todo-items, todo-feedback, boards, board-positions, session-survey, sweep-marks; merge-queue covered by the #447 port in #469. Close when both are merged and pinned.

_2026-10-21T17:27:00Z_ — Completed (`status: completed`): both `litlfred/cat-harness-tools#469` and the `cat-harness` `coversKinds` / `state-viewer` `renders` declarations are merged and re-pinned into `folio-assistant` `main` (`674a1b8113`, PR `#2611`). All 12 work-state kinds (`bean-defs`, `bean-notes`, `workflow-state`, `memory`, `sweep-marks`, `boards`, `board-positions`, `merge-queue`, `session-survey`, `todo-feedback`, `todo-items`, `interaction`) are covered by declared visualisers and `check:visualiser-routes` passes.
