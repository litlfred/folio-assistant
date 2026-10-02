---
# folio-assistant-2h76
title: 'STATE BRANCH P2: mechanism — storage keyedBy tip, branch-store splice-write, seed the orphan ''state'' branch, session-start mount at state/'
status: todo
type: task
created_at: 2026-10-02T10:58:10Z
updated_at: 2026-10-02T10:58:10Z
parent: folio-assistant-fs43
---

Serial, one agent. Reuses the 3fva spike 3ds9 write path (hash-object, mktree, commit-tree, push; never -f).

## Done when
- [ ] schema field with keyedBy: tip
- [ ] branch-store.ts with retry over a moved tip
- [ ] state branch seeded with a hash-verified manifest
- [ ] session-start hook mounts state/ and fails LOUDLY when it cannot
- [ ] bun run state:push
- [ ] measured: two sessions editing the SAME bean concurrently — no lost edit

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md

## Owner go, 2026-10-02
"start Phase 2 after #1764 merges". Blocked on #1764 (arc 3fva) merging, which ships `DirectoryStorageSchema` and `qa-store.ts`. This session subscribes to #1764 and starts on its merge, on a fresh branch from the new main:
1. extract qa-store's generic `Store` into `scripts/branch-store.ts`; `qa-store` imports it (no behaviour change, its tests stay green);
2. widen `keyedBy` to `z.enum(["commit", "tip"])`;
3. `state-store.ts` — tip-keyed read / splice-write over branch-store;
4. seed `state` (only on a separate go: creating a remote branch is outward-facing).
