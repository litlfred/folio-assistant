---
# folio-assistant-oait
title: 'TOOL 6/13: Task_Validate — content graph & dependency analysis (19 files, 1 entry point)'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:34:35Z
updated_at: 2026-09-20T04:34:35Z
parent: folio-assistant-d308
---

Group 6 of 13 in `d308`. **19 files, 1 entry point.**

`content-graph`, `uses-field`, `uses-graph-hash`, `graph-index`, `graph-search`,
`semantic-cone`, `prune-transitive-deps`, `verify-block-walk`, `integration-audit`,
`audit-wiring`, `orphan-verdict-sweep`, `conjectural-propagation-audit`,
`conjectural-propagation-sweep`, `q-usage-audit`, `qa-checkers-q-usage`,
`wall-violations-sweep`, `proof-axis-dashboard`,
`proof-narrative-lean-equiv-sweep`.

**BPMN:** `authoring-a-paper · Task_Validate`, `serviceTask`, refs
`content-validate`. Shares that task with group 7 — the first place where
"one Tool per task" is already not one-to-one, and that is fine: a task may be
served by more than one Tool, which is what `alternativeTo` and `selection` are
for.

**Target repo (#223):** `folio-assist-core`.

**The rule this group must not break:** `uses[]` and `interprets` are the
EDITORIAL relation — what a READER must have read. They are never populated from
Lean. A Tool over this group that offered to "sync uses from the formal graph"
would destroy the signal every ordering metric is computed from. See
`uses-editorial-review`.

## Done when
- [ ] a Tool node over the graph queries
- [ ] `satisfies` includes `content-validate`
- [ ] nothing in its IO offers to write `uses[]` from `lean.ref`
- [ ] `tool-coverage` reflects it
