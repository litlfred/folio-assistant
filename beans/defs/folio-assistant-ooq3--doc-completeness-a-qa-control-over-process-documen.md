---
# folio-assistant-ooq3
title: 'DOC COMPLETENESS: a QA control over process documentation — 45 of 62 diagrams are shown on no page, 95 of 456 steps undocumented, adjudication callers do not call it'
status: in-progress
type: task
created_at: 2026-09-23T06:49:40Z
updated_at: 2026-09-23T06:49:40Z
---

Owner 2026-09-23 (session_01SiFEMuTciyB681XP5WfcbB): asked whether the adjudication process (7pdi) is rendered; it is rendered (adjudication.svg fresh) but shown on no page. Owner: 'add skills/bpmn/sub-process to surface it. show documentation' then 'make this a QA control on documentation completion - lots of issues were found'.

## Measured 2026-09-23 over 62 cat-harness diagrams
- process-level documentation: 62/62
- rendered SVG: 62/62
- SVG shown on any docs page: 17/62 (45 never shown)
- activities without documentation: 95 of 456
- activity names a skill that owns its own process, one step only, and is not a call activity: 9 (5 adjudication, ingest-theme->theme-ui-review, 3 ->feature-staging)

## Done when
- [ ] kg-qa criteria: process-diagram-published, activity-documented, activity-calls-skill-process — sidecars written
- [ ] gen-processes-viz writes one page per process: documentation, embedded diagram, lanes, steps with skill links, callers/callees
- [ ] generated skill pages list the processes that run them, embedding the skill's own process diagram
- [ ] the 5 adjudication steps become call activities of adjudication.bpmn; SVGs re-rendered
- [ ] bun run gates green
