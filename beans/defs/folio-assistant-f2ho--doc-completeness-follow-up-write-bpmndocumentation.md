---
# folio-assistant-f2ho
title: 'DOC COMPLETENESS follow-up: write <bpmn:documentation> for the steps activity-documented reports'
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T07:40:08Z
updated_at: 2026-09-23T08:22:51Z
parent: folio-assistant-1swy
---

Follows bean ooq3 / PR #1008 (issue #1007). Owner 2026-09-23 chose a SEPARATE PR, after #1008 merges.

activity-documented (kg-qa, minor, not gated) reported 95 undocumented steps across the cat-harness diagrams when it landed — read the current count from the sidecars, never from this line.

## Done when
- [x] #1008 merged
- [ ] the processes with the most undocumented steps done first (worst at landing: activity-log 8, l2-dak-authoring 7, ig-incremental 7, board-open-close 7)
- [ ] each step's documentation says what it asks of its performer, not a restatement of its name
- [ ] SVGs, process pages and kg-qa sidecars regenerated; bun run gates green
