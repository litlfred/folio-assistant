---
# folio-assistant-rn24
$schema: bean/1.0.0
title: 'GATES: content-root gate set follow-ups (smart-ra re-pin, drop the PREREQUISITE_FILES skip)'
status: todo
type: task
priority: normal
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-30T12:45:00Z
parent: folio-assistant-3fva
---

Bean for cat-harness-tools#281. The decision is made and implemented: smart-ra is held to its own gate set (cat-harness-tools#288; `scripts/lib/root-gate-set.ts`, `.github/scripts/layer-pr-checks/run-gates.py`).

## Done when
- [ ] smart-ra's `index.lock.json` is re-pinned off cat-harness-tools 954ef7b, through the consent-recorded `mount:remote --seed` together with a cat-harness re-pin
- [ ] the `PREREQUISITE_FILES` skip in `run-gates.py` is dropped. This needs `glossary:page` to run before `uml:overview:check` in smart-ra, and a PlantUML renderer (the jar fetch failed).

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)
