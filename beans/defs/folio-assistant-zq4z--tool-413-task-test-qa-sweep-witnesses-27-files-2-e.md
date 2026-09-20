---
# folio-assistant-zq4z
title: 'TOOL 4/13: Task_Test — QA sweep & witnesses (27 files, 2 entry points)'
status: todo
type: task
priority: high
created_at: 2026-09-20T04:34:35Z
updated_at: 2026-09-20T04:34:35Z
parent: folio-assistant-d308
---

Group 4 of 13 in `d308`. **27 files, 2 entry points** — the widest gap between size and
reachability in the whole table.

`qa-sweep`, `qa-agent-entry`, `qa-agent-drain-queue`, `qa-checker-discovery`,
`qa-checkers-*` (cost, dak, extended, python, q-usage, render, triviality, uses,
vacuity, voice), `qa-criteria-registry`, `qa-criterion-hash`, `qa-merge-findings`,
`qa-staleness`, `qa-witness`, `witness-audit`, `bib-qa`, `check-declared-assets`.

**BPMN:** `content-lifecycle · Task_Test` (`serviceTask`, refs `content-test`) and
`editing-hci-validation · Task_BuildGates`.

**Target repo (#223):** splits — sidecar infrastructure is `agentic-harness`, the
individual checkers are `folio-assist-core` (and `qa-checkers-dak` is `smart-base`).

**Why 2 entry points for 27 files is the interesting number:** this group is already
almost entirely library-behind-one-command, which is the END STATE `d308` argues
for. It is therefore the cheapest node on the list and the best worked example —
one Tool over a checker registry, with the registry unchanged.

## Done when
- [ ] a Tool node over `qa-sweep`, with the checker registry untouched
- [ ] `satisfies` includes `content-test`
- [ ] the checker discovery mechanism documented as the extension point, not the entry point
- [ ] `tool-coverage` reflects it
