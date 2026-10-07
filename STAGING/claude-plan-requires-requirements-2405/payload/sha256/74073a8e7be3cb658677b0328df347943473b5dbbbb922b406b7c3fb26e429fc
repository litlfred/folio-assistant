---
# folio-assistant-yr93
title: 'Check before you create, extended: dedupe on the TARGET object, a stale-claim reset rule, close-evidence reconciliation'
status: completed
type: task
priority: normal
created_at: 2026-10-04T15:09:15Z
updated_at: 2026-10-04T15:30:37Z
parent: folio-assistant-ahvw
---

Evidence: qou work-plan analysis 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). qou: 141 duplicate groups, mostly generator re-runs filing the same Lean declaration under different titles; 567/584 in-progress beans untouched >14 days.

## Done when
- [x] todo-manager or bean-coordination carries: target-keyed dedupe, lsi:near as the latent check, the 14-day no-commit claim reset (to todo, with a note), and close-evidence reconciliation that respects an owner's reopen sweep


## Summary of Changes
_2026-10-04T15:30:37Z_ — PR #2107. todo-manager §'Check before you create' gains target-keyed dedupe: a `Target: lean:|block:|file:` line, grepped across the whole store and archive before creating; generators MUST write it; the typed field is bean f227. lsi:near was already there. bean-coordination gains §'A stale claim is reset to todo, and the reset keeps the record' (no liveness signal and no commit in 14 d, so the threshold matches bean-stale-in-progress; a sweep run by a session or the owner, never unattended; the note records the former holder) and §'Reconciling closes in bulk — and an owner's reopen outranks your evidence' (read the status history; a bean that was reopened is not closable on evidence that predates the reopen; measured on qou's 7sin sweep, a61496d).
