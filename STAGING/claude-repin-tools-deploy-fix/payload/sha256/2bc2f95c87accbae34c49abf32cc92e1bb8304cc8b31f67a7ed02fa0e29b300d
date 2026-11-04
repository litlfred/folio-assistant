---
# folio-assistant-17iw
$schema: bean/1.0.0
title: 'MIGRATION: public-health and health-system process catalogues move from smart-base to WHO/who-iris once it is live'
status: todo
type: task
priority: normal
created_at: 2026-10-24T07:25:00Z
updated_at: 2026-11-01T22:00:00Z
parent: folio-assistant-rwmf
---

Owner, 2026-10-24 (bean `2ipj`): *"eventually we will have WHO/who-iris. leave in smart-base for now, but bean up migration once WHO/who-iris is live"*.

## What moves

The public-health and health-system process catalogues (BusinessProcessWorkflow + BPMN, with persona ActorDefinitions), drawn from the DTH handbooks ingested in smart-base's library. The clinical catalogue is not in scope: it goes to smart-base-clinical (owner, 2026-10-10).

## Blocked until

`WorldHealthOrganization/who-iris` exists and is live. Do not create or push to it, or open PRs there, without the owner's explicit permission (WHO repos rule).

## Done when

- [ ] the catalogues and their library sources are in WHO/who-iris, and smart-base keeps a tombstone or redirect for each moved path
- [ ] the recommendation-scenario extraction (`smart-base/scripts/l1-recommendation-scenarios.ts`) reads the domain catalogue from its new home
- [ ] pins and `index.config.json` name who-iris where the catalogues are read

Session https://claude.ai/code/session_01UbCbH19GrhqDNakmbgQTF3.

_2026-10-24T08:25:00Z_ — Owner re-asked (structured question Q3, 08:19Z): **"A": keep waiting** until WHO/who-iris is live. Not in any drain queue until then. Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.

_2026-11-01T22:00:00Z_ — Parent moved from `uhkv` (completed) to `rwmf`, owner card Q-DEP-3 A. Still `todo`: it waits on who-iris being live. (https://claude.ai/code/session_01Qmmkt7WC5Hw4WbcF7NXrSa)
