---
# folio-assistant-7wgs
title: Record when a materialized copy is last READ, so cache:index can rank eviction by use
status: todo
type: task
priority: normal
created_at: 2026-09-23T20:03:49Z
updated_at: 2026-09-23T20:03:49Z
parent: folio-assistant-5a3l
---

Follow-up from bean `54rk`. `cache:index` has a last-read column and it says `not recorded` for all 276 copies, because nothing records reads.

Owner, 2026-09-23, choosing among "say not recorded", "add a lastReadAt field" and "use the file's access time": **say not recorded**, and open this bean for recording reads later.

**Why not file access time:** it is disabled on many mounts (noatime) and reset by a git checkout, so it would look precise and mean nothing.

## Done when
- [ ] Decide WHO records a read. Candidates: skill_fetch / the MCP server serving a node, the renderer, or an explicit touch by a caller. Each is a different definition of 'read'.
- [ ] An optional `lastReadAt` (or equivalent) on the materialization record, written by that reader.
- [ ] `cache:index` shows it where recorded, still `not recorded` elsewhere, and eviction can rank by it.
