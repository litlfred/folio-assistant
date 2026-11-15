---
# folio-assistant-i9fv
$schema: bean/1.0.0
title: 'Memory: ArchiMate view line straightening (render-view.ts routeConnections) - issue cat-harness-tools#1886, PR #1887, card Q-ARR-1 (2026-11-11)'
status: completed
type: task
priority: low
created_at: 2026-11-11T12:11:04Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `archimate-straight-lines.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: ArchiMate view line straightening (render-view.ts routeConnections) - issue cat-harness-tools#1886, PR #1887, card Q-ARR-1 (2026-11-11)

Owner (2026-11-11 12:03Z) asked to "straighten up diagram arrows" on smart-ra view lmir-overview. Thread "Straighten ArchiMate diagram arrows" (cmsg_017WNUkNK8kdDziPK58Pv6G9D1an5nNBLdAUoXgAGbn4KV).

Fix is general, in cat-harness-tools archimate/scripts/render-view.ts `routeConnections` → new `squareUp`: snap near-orthogonal Archi bends (SNAP 12px), drop bends inside end boxes, square-on ends (`attach`), straight lines across axis overlaps with `freeSpot` spacing, corner-to-corner for boxes apart on both axes. Tests: archimate/scripts/routing.test.ts. Over smart-ra's 3 models: slanted segments 770→242, tangles 226→168.

Draft PR #1887 (branch claude/archimate-straight-lines), renders on branch claude/archimate-straight-lines-shots (not for merge) and /mnt/project-files/archimate-straight-lines-2026-11-11/. Card Q-ARR-1: A = merge when full suite green then re-pin smart-ra + republish (recommended), B = hold for review.

STATUS 17:55Z 11-11: Q-ARR-1 = A; #1887 merged (6a7a4e63). Live page waits on merge manager's smart-ra#241 re-pin (publish-on-merge); merge manager told. Remaining: confirm live lmir-overview, then resolve thread. 23:00Z: #241 still open/unstable, live SVG still old; polling stopped, user told.

Local test setup: clone bootstrap-tools/cat-harness/bootstrap and COPY (not symlink) into node_modules/@litlfred, set CAT_HARNESS_ROOT. Coordinate with thread "Add card table of contents to ArchiMate pages" (…TUkZHyWzJYoA6z6NaPCdY8), same renderer.
