---
# folio-assistant-syiq
$schema: bean/1.0.0
title: 'S4-a: cat-harness sci-subject skills move or split to folio-assistant-sci (watchers, editorial graph, Milnor; ~48 rows)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-24T11:35:00Z
parent: folio-assistant-7x5n
---

Story S4 (rfuq). Rows: cat-harness/docs/proposals/placement-audit-2026-10-01.json (PR #1778) — instance=cat-harness, KG kinds, target folio-assistant-sci, pr 'unplanned' (MOVE 15, SPLIT 23, AMBIGUOUS 10). Owner rulings 2026-10-01: Q1 integration-watcher family -> sci, generic integration-watcher stays; Q2 editorial graph split (uses[] stays, Lean comparison -> sci); Q3 Milnor -> sci, markdown-render-check split.
## Done when
- [ ] every listed row moved/split per its verdict
- [ ] gates green; merged

## State 2026-10-09
Re-derived from `cat-harness/docs/proposals/placement-audit-2026-10-01.json` against the post-split mount (cat-harness bd72c68): of the **48** cat-harness rows marked `unplanned` with a folio-assistant-sci target, **47** are still at their original path. Not started. Now a pair of cross-repository PRs (litlfred/cat-harness → litlfred/folio-assistant-sci), one at a time per `rfuq`. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

_2026-10-15T16:49Z_ — Block lifted: `hx65` is completed (main green, #1774 merged). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured against cat-harness main: 34 of the 48 rows are still at their original path (was 47 on 2026-10-09). Only 2 are plain MOVEs (`authoring-core/editor.md`, `graph-management/edge-kinds-and-blast-radius.md`); 22 are SPLITs and 10 AMBIGUOUS, each needing a per-file edit.

_2026-10-24T09:40:00Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx (agy released it at 09:06Z).

## 2026-10-24 — owner ruling on the 7 unsettled rows (choice A)

The owner chose **A, keep and split all 7** at 09:47Z: content-graph, corpus-grep, integration-watch, narrative-asserts-code, devils-advocate-watcher, editor and edge-kinds-and-blast-radius stay in cat-harness. Only their maths or Lean passages move to folio-assistant-sci, and sci links down to them. The audit marked editor and edge-kinds-and-blast-radius as plain MOVEs, but both are used generically (editor is a role skill named by `schemas/assistant-workflow.ts`; edge-kinds is the deliberately domain-free form), so they are splits too.

First pair: `milnor-exposition-standard` (ruling Q3), folio-assistant-sci#72 + cat-harness#530, tracked in cat-harness#529. Session https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx

## 2026-10-24 — progress, and owner ruling B on the name-only rows

- Milnor (Q3) moved: sci#72 + cat-harness#530, merged.
- compute- and detangler-integration-watcher (Q1): sci#77 merged, cat-harness#540 open.
- Dispatch tables inverted (block-density, canonical-watcher, one-voice-integration-watcher, todo-review): sci#78 + cat-harness#544.
- scientific-accuracy split; the formal-layer half is sci `formal-accuracy`: sci#79 + cat-harness#545.
- The owner chose **B** at 11:22Z: no science skill name stays in cat-harness prose, "generalize if/as needed". Nine pages were rewritten generically, and 15 sci skills record the lineage: sci#80 + cat-harness#550.

Remaining: 8 science-subject splits (content-profiles, md-authoring, readability-editing, content-test, graph-rendering, lean-verification.json, delivery-summary, html-rendering-qc), uses-editorial-review and markdown-render-check (Q2/Q3 splits), and the 7 kept by ruling A (split their maths passages out).
