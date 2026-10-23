---
# folio-assistant-7wgs
$schema: bean/1.0.0
title: Record when a materialized copy is last READ, so cache:index can rank eviction by use
status: completed
type: task
priority: normal
created_at: 2026-09-23T20:03:49Z
updated_at: 2026-10-09T19:15:00Z
parent: folio-assistant-5a3l
---

Follow-up from bean `54rk`. `cache:index` has a last-read column and it says `not recorded` for all 276 copies, because nothing records reads.

Owner, 2026-09-23, choosing among "say not recorded", "add a lastReadAt field" and "use the file's access time": **say not recorded**, and open this bean for recording reads later.

**Why not file access time:** it is disabled on many mounts (noatime) and reset by a git checkout, so it would look precise and mean nothing.

## Done when
- [x] Decide WHO records a read. Decided: explicit touch / reader helper (`recordMaterializationRead` / `touchMaterializedRead`) callable by any reader (MCP tool serving a node, skill_fetch, renderer, or caller touch). Access time (`atime`) is disabled on many mounts (`noatime`) and reset on checkout, making explicit touch the only reliable mechanism.
- [x] An optional `lastReadAt: z.string().min(1).optional()` on the materialization record (`MaterializationSchema`), populated by `touchMaterializedRead` / `recordMaterializationRead`.
- [x] `cache:index` shows it where recorded, still `not recorded` elsewhere, and eviction can rank by it (least recently read copies prioritized for eviction; missing `lastReadAt` displayed as "not recorded" and sorted after expired/known stale).

## Closed 2026-10-09

- **Decided reader mechanism**: Explicit reader helper `recordMaterializationRead(record: Materialization, at?: Date): Materialization` (aliased as `touchMaterializedRead`). Readers such as `skill_fetch`, MCP node access, renderer, or callers record access with explicit ISO 8601 timestamps without relying on flaky filesystem `atime`.
- **Schema & Helpers**: Added `lastReadAt: z.string().min(1).optional()` to `MaterializationSchema` in `schemas/materialization.ts`. Implemented `recordMaterializationRead` and `touchMaterializedRead`.
- **Cache Index & Eviction Ranking**: Updated `CacheRow.lastReadAt?: string` and `cacheRows()` to extract `lastReadAt`. Updated `evictionCandidates()` and `compareEvictionCandidates()` to prioritize least recently read copies (oldest `lastReadAt` first) ahead of more recently read and unrecorded copies. Updated `summarise()` to track `lastReadRecorded` and display `recorded X · not recorded Y` when reads are present.
- **Commits & Branches**:
  - `cat-harness`: branch `claude/7wgs-materialized-last-read-eviction`, commit `eed3d7fa`
  - `folio-assistant-core`: branch `claude/7wgs-materialized-last-read-eviction`, commit `dfa9cab`
- **Verification Evidence**:
  - 11 unit tests passing in `scripts/tests/materialization-last-read.test.ts`
  - 13 unit tests passing in `scripts/cache-index.test.ts`
  - 13 unit tests passing in `schemas/materialization-compiled.test.ts`
  - `bun run typecheck` clean (0 errors)
