---
# folio-assistant-ooq3
title: 'DOC COMPLETENESS: a QA control over process documentation — 45 of 62 diagrams are shown on no page, 95 of 456 steps undocumented, adjudication callers do not call it'
status: completed
type: task
priority: normal
created_at: 2026-09-23T06:49:40Z
updated_at: 2026-09-23T08:22:51Z
parent: folio-assistant-1swy
---

Owner 2026-09-23 (session_01SiFEMuTciyB681XP5WfcbB): asked whether the adjudication process (7pdi) is rendered; it is rendered (adjudication.svg fresh) but shown on no page. Owner: 'add skills/bpmn/sub-process to surface it. show documentation' then 'make this a QA control on documentation completion - lots of issues were found'.

## Measured 2026-09-23 over 62 cat-harness diagrams
- process-level documentation: 62/62
- rendered SVG: 62/62
- SVG shown on any docs page: 17/62 (45 never shown)
- activities without documentation: 95 of 456
- activity names a skill that owns its own process, one step only, and is not a call activity: 9 (5 adjudication, ingest-theme->theme-ui-review, 3 ->feature-staging)

## Done when
- [x] kg-qa criteria: process-diagram-published, activity-documented, activity-calls-skill-process — sidecars written
- [x] gen-processes-viz writes one page per process: documentation, embedded diagram, lanes, steps with skill links, callers/callees
- [x] generated skill pages list the processes that run them, embedding the skill's own process diagram
- [x] the 5 adjudication steps become call activities of adjudication.bpmn; SVGs re-rendered
- [x] bun run gates green

## Progress — 2026-09-23 (PR #1008)

- `process-diagram-published`: 45 → **0** findings once per-process pages exist.
- `activity-calls-skill-process`: 9 → **4**. The 5 adjudication steps now call
  `Process_Adjudication`. Left for the owner: `crdm-deliver` · `A_DeployStaging`,
  `docs-site-publish` · `Task_Restore`, `upstream-version-adoption` · `Task_Mvp`
  (all → `feature-staging`) and `ingest-theme` · `Task_Review` → `theme-ui-review`.
- `activity-documented`: the backlog stands (minor, not gated) — 95 steps.

## Settled — 2026-09-23, owner chose "declare reasons"

The 4 remaining `activity-calls-skill-process` findings were compared against
what a call would actually run (the engine enters `startNodes[0]` and runs to
the end): none fits. They now carry `<folio:no-call reason="…"/>` —
reason required at load, same rule as `no-skill` — and the criterion is 0.

## Summary of Changes

Merged in PR #1008 (2026-09-23, owner's "merge it"). `kg:audit` gains
`process-diagram-published` (45 → 0), `activity-calls-skill-process` (9 → 0:
5 adjudication steps became call activities, 4 carry `<folio:no-call reason>`)
and `activity-documented` (95, minor — follow-up bean `f2ho`). One generated
page per process; skill pages list the processes that run them.
