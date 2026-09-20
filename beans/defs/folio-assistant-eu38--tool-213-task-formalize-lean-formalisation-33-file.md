---
# folio-assistant-eu38
title: 'TOOL 2/13: Task_Formalize — Lean formalisation (33 files, 16 entry points)'
status: todo
type: task
priority: high
created_at: 2026-09-20T04:34:12Z
updated_at: 2026-09-20T04:34:12Z
parent: folio-assistant-d308
---

Group 2 of 13 in `d308`. **33 files, 16 entry points.**

`lean-*` (audit, build-all, build-bg, build-timed, cache-dump,
closure-orchestrator, compile-audit, coverage, witness), `lake-cache*`,
`setup-lean-toolchain`, `setup-elan-symlinks`, `reseed-lean-cache`,
`install-lean-atlas`, `extract-lean-blocks`, `lean_auto_discharge`,
`lean-triviality-probe`, `trivial-skeleton-audit`,
`check-self-discharging-instances`.

**BPMN:** `authoring-a-paper · Task_Formalize`, `serviceTask`, refs
`lean-formalization` — and the diagram refs `proof-verification` on the same
step, so this group may satisfy two skills.

**Target repo (#223):** `folio-asst-sci`.

**Caution, recorded before the work rather than after it:** 16 entry points
spanning build, cache, audit and probe is not one command with modes. This is the
group most likely to be a small FAMILY of Tools, and forcing it into one node
would produce exactly the invoke-a-string-and-hope node the schema refuses
elsewhere.

## Done when
- [ ] Tool node(s) covering build, cache and audit as distinct concerns if they are
- [ ] `satisfies` includes `lean-formalization`; `proof-verification` if it holds
- [ ] `requires.runtime` names `lean` / `elan` honestly
- [ ] `tool-coverage` reflects it
