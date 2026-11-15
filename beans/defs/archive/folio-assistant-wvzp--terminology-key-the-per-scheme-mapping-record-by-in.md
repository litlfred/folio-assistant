---
# folio-assistant-wvzp
$schema: bean/1.0.0
title: 'TERMINOLOGY: key the per-scheme mapping record by instance as well as scheme id (from 5yhm)'
status: completed
type: task
priority: normal
created_at: 2026-10-24T08:35:00Z
updated_at: 2026-10-24T09:50:00Z
parent: folio-assistant-0lmb
---

Moved out of `5yhm` when it closed (owner, 2026-10-24, Q7). Not blocked.

A scheme id such as `kg-tools` is shared by every instance's extraction. Term ids are unique across instances only by observation (0 collisions in 2,876). The glossary page answers `unknown` on a collision; the record should not depend on that.

## Done when
- [x] the per-scheme record in the term-mapping result is keyed by (instance, scheme id)
- [x] a fixture with a deliberate cross-instance id collision is resolved correctly, not reported `unknown`

Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.

_2026-10-24T08:33:00Z_ — Claimed by the cloud drain thread "Drain content model and ingest beans" (session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU).

_2026-10-24T08:55:00Z_ — Owner ruling B (08:41Z): key by the scheme file as a clean break; the proper key is bean q3n9 under GOAL 1. PRs: `litlfred/cat-harness#524`, `litlfred/cat-harness-tools#708`, `litlfred/folio-assistant-core#206`.

_2026-10-24T09:50Z_ — Handed over to the separation drain thread (session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e) by the content drain thread. Done together with q3n9 box 2: the three PRs move from the file key to (instance, scheme), owner ruling A on q3n9.

## Done (2026-10-24)

Merged cat-harness#524 (6c6e761), cat-harness-tools#708 (297818e), folio-assistant-core#206 (907f019). Records key by (instance, scheme); `file` retired.
