---
# folio-assistant-syiq
$schema: bean/1.0.0
title: 'S4-a: cat-harness sci-subject skills move or split to folio-assistant-sci (watchers, editorial graph, Milnor; ~48 rows)'
status: todo
type: task
priority: normal
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-09T17:42:07Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-hx65
---

Story S4 (rfuq). Rows: cat-harness/docs/proposals/placement-audit-2026-10-01.json (PR #1778) — instance=cat-harness, KG kinds, target folio-assistant-sci, pr 'unplanned' (MOVE 15, SPLIT 23, AMBIGUOUS 10). Owner rulings 2026-10-01: Q1 integration-watcher family -> sci, generic integration-watcher stays; Q2 editorial graph split (uses[] stays, Lean comparison -> sci); Q3 Milnor -> sci, markdown-render-check split.
## Done when
- [ ] every listed row moved/split per its verdict
- [ ] gates green; merged

## State 2026-10-09
Re-derived from `cat-harness/docs/proposals/placement-audit-2026-10-01.json` against the post-split mount (cat-harness bd72c68): of the **48** cat-harness rows marked `unplanned` with a folio-assistant-sci target, **47** are still at their original path. Not started. Now a pair of cross-repository PRs (litlfred/cat-harness → litlfred/folio-assistant-sci), one at a time per `rfuq`. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
