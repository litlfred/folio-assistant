---
# folio-assistant-4l5q
title: 'B7b (#1168): a skill declares the directories it governs (graph-kinds:, governs:); coverage.skill removed'
status: in-progress
type: task
priority: normal
created_at: 2026-09-24T19:50:21Z
updated_at: 2026-09-24T19:50:21Z
parent: folio-assistant-tr05
---

Owner 2026-09-24: 'A' for coverage.skill, and 'skill names the directory' for a domain skill over a generic-kind directory. 24 kind claims added to skills' graph-kinds:; 5 directories whose kinds are all generic named in governs: as <instance>/<id>. scripts/skill-governance.ts reads both; a kind claim reaches the skill's instance, its dependents, and the platform. check-subgraph-coverage derives the governing skill (skill findings identical before/after); coverage.skill removed from 59 entries and the schema.
