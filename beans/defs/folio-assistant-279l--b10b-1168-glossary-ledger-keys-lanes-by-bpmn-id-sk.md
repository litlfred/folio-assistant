---
# folio-assistant-279l
title: 'B10b (#1168): glossary ledger keys lanes by BPMN id; SKOS altLabel for renames; key pattern enforced + QA gate'
status: completed
type: task
priority: normal
created_at: 2026-09-30T14:59:53Z
updated_at: 2026-09-30T17:07:28Z
parent: folio-assistant-tr05
---

Owner 2026-09-30: do as rec + QA gate + use SKOS for rename/alternate name. lane/<name> → process/<p>/lane/<laneId> (kg-export's identity); propertyNames pattern; a gate that fails on an off-pattern key; a renamed lane keeps its key and the old name becomes skos:altLabel (not a new term).
## Done when
- [ ] ledger keys match ^(role|process)/…; lane/Actor migrated
- [ ] rename handled as altLabel/historyNote
- [ ] CI gate



## Done
- Varying-lane key = process/<bpmn:process id>/lane/<bpmn:lane id> (kg-export's Lane identity); lane/Actor → process/Process_LogMessage/lane/Lane_Actor, firstSeen kept.
- LEDGER_KEY pattern enforced by LedgerSchema (propertyNames).
- Rename: liveLedgerEntry keeps the key and records formerLabels, published as skos:hiddenLabel.
- QA gate: glossary-export.test parses every committed ledger and fails on a live lane key no diagram declares.
