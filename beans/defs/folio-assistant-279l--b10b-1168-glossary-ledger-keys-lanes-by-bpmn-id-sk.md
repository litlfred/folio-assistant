---
# folio-assistant-279l
title: 'B10b (#1168): glossary ledger keys lanes by BPMN id; SKOS altLabel for renames; key pattern enforced + QA gate'
status: in-progress
type: task
created_at: 2026-09-30T14:59:53Z
updated_at: 2026-09-30T17:02:44Z
parent: folio-assistant-tr05
---

Owner 2026-09-30: do as rec + QA gate + use SKOS for rename/alternate name. lane/<name> → process/<p>/lane/<laneId> (kg-export's identity); propertyNames pattern; a gate that fails on an off-pattern key; a renamed lane keeps its key and the old name becomes skos:altLabel (not a new term).
## Done when
- [ ] ledger keys match ^(role|process)/…; lane/Actor migrated
- [ ] rename handled as altLabel/historyNote
- [ ] CI gate

_2026-09-30T17:02:44Z_ — Claimed by claude/sharp-einstein-970n6g — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
