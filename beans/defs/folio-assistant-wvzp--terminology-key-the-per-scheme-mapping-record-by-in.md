---
# folio-assistant-wvzp
$schema: bean/1.0.0
title: 'TERMINOLOGY: key the per-scheme mapping record by instance as well as scheme id (from 5yhm)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-24T08:35:00Z
updated_at: 2026-10-24T08:33:00Z
parent: folio-assistant-0lmb
---

Moved out of `5yhm` when it closed (owner, 2026-10-24, Q7). Not blocked.

A scheme id such as `kg-tools` is shared by every instance's extraction. Term ids are unique across instances only by observation (0 collisions in 2,876). The glossary page answers `unknown` on a collision; the record should not depend on that.

## Done when
- [ ] the per-scheme record in the term-mapping result is keyed by (instance, scheme id)
- [ ] a fixture with a deliberate cross-instance id collision is resolved correctly, not reported `unknown`

Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.

_2026-10-24T08:33:00Z_ — Claimed by the cloud drain thread "Drain content model and ingest beans" (session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU).
