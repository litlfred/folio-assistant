---
# folio-assistant-zttv
$schema: bean/1.0.0
title: 'Memory: Root cause of the remote-mount H1-H6 CI flake (real github.com curl), fixed in tools#1712; curl download limits merged in tools#1715 (11-11)'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `hydrated-mount-flake-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Root cause of the remote-mount H1-H6 CI flake (real github.com curl), fixed in tools#1712; curl download limits merged in tools#1715 (11-11)


Cause: in cat-harness-tools `scripts/tests/remote-mount.test.ts`, the hydrated tests called mountRemote with no packageUrlFor, so the G2b package fallback curled real github.com release URLs with no time limit. Test fix (empty file:// CAT_MOUNT_URL_PREFIX) merged as tools#1712 on 2026-11-08.

tools#1715 (curl connect 15 s / stall 30 s / max 600 s limits in download()) merged 2026-11-11 by the merge manager.

Follow-up: two real-corpus checkAll tests in ingest-and-l1.test.ts ran over bun's 5 s default on busy runners; given 30 s like their sibling in tools#1928 (issue #1927), merged 2026-11-12 (Q-L1T-1 = A).

**Why:** a timeout bump hid a network dependency; tests must use file:// fixtures for package fetches too.
**How to apply:** for real-corpus local walks a timeout budget is fine; for network-touching tests fix the dependency instead.
