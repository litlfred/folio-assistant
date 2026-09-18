---
# folio-assistant-j42g
title: 'HARNESS: rename the process graph kind to process-state'
status: completed
type: task
priority: normal
created_at: 2026-09-18T18:02:45Z
updated_at: 2026-09-18T18:02:45Z
---
## What

The graph kind `process` renamed to `process-state`. In BPMN, "process" means
the DIAGRAM; this kind means instances of one. Flagged as an open question on
#263 and answered by the author.

It also makes the kind match its directory id, as `workplan`, `kg` and
`schemas` already do — and it agrees with `skills/folio-core/process-state.md`,
a sibling's skill that independently chose the same term for the same concept.

Targeted rather than blanket: `scripts/tests/workflow-gate.test.ts` uses
`process:` as an unrelated field name and the CRDM eval corpus mentions the
word in prose. Neither was touched.
