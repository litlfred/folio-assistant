---
# folio-assistant-xpla
$schema: bean/1.0.0
title: 'Memory: smart-ra library pages look old (unthemed en/folio-assistant-core/library/) because of stale pins + publish-by-hand; smart-ra#240, card Q-RAL-1'
status: completed
type: task
priority: low
created_at: 2026-11-11T12:09:19Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-ra-library-stale-pins-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-ra library pages look old (unthemed en/folio-assistant-core/library/) because of stale pins + publish-by-hand; smart-ra#240, card Q-RAL-1

Thread "Fix smart-ra library page styling" (cmsg_017WNUkNK8kdDziPK58Pv6G9Xrda1M625EH8d7XqK3sPDC), 2026-11-11.
- Cause: smart-ra pins core 705a2b8 / cat-harness 19871a5 / tools 961b4d9 (11-05/08 set); at those pins the build still writes the old standalone library page at en/folio-assistant-core/library/<key>/ (inline CSS, no jtd theme). Newer pins (dth-phc: core 05f5525, ch df6a3c0, tools ba1af6f) do not. Themed copy exists at en/cat-harness/library/dpi-h-ra/<key>/.
- smart-ra site-publish.yml is workflow_dispatch only; gh-pages last published 2026-11-08 20:10Z. dth-phc publishes on push to main.
- Re-pin needs workflow edits (# index.lock.json refs) -> asked merge manager. Issue smart-ra#240. Card Q-RAL-1 answered A by owner tap 12:22:49Z. Fix PR smart-ra#241 (merge manager, branch claude/smart-ra-repin-publish; will also take tools past #1887 for ArchiMate arrows). After merge: check live page.
- litlfred.github.io is blocked by the sandbox proxy: read gh-pages via gh api contents (attached repo) or git fetch --filter=blob:none.
Related: folio-assistant-q5sw
