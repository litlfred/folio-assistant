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
- [x] state branch seeded with a hash-verified manifest (2026-10-02, see below)
- [ ] session-start hook mounts state/ and fails LOUDLY when it cannot
- [ ] bun run state:push
- [ ] measured: two sessions editing the SAME bean concurrently — no lost edit

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md

## Owner go, 2026-10-02
"start Phase 2 after #1764 merges". Blocked on #1764 (arc 3fva) merging, which ships `DirectoryStorageSchema` and `qa-store.ts`. This session subscribes to #1764 and starts on its merge, on a fresh branch from the new main:
1. extract qa-store's generic `Store` into `scripts/branch-store.ts`; `qa-store` imports it (no behaviour change, its tests stay green);
2. widen `keyedBy` to `z.enum(["commit", "tip"])`;
3. `state-store.ts` — tip-keyed read / splice-write over branch-store;
4. seed `state` — owner go 2026-10-02 ("go ahead and seed the state branch too"); DONE, see below.

## Seeded 2026-10-02

Owner: "go ahead and seed the state branch too". Done ahead of #1764, because
seeding is plain git plumbing and needs none of its code.

- `state` = `d913ea4` (orphan, author folio-state-bot), tree `e9744ac`, seeded from
  `main@85b9578b630e`. `manifest.json` (`state-manifest/v1`) says `status: seed`,
  `authoritative: false`: **main stays the source of truth until Phase 3**, and the
  branch is re-seeded at cutover.
- Copied, paths mirrored: `beans/defs` (1239 files), `beans/workflows` (10),
  `beans/surveys` (2), `todos` (11), `issue-marks` (3),
  `cat-harness/test/health/results` (2).
- Verified: each path's git TREE id on `state` equals `main`'s, before the push and
  again from a cold `git init` reader (`fetch --depth=1 --filter=blob:none`,
  0.75 s). 0 mismatches.
- D2 evidence: a plain (non-force) push of a new branch from a claude.ai/code
  container succeeded.

Commands (no worktree, private index):
```
GIT_INDEX_FILE=$tmp git read-tree --prefix=<p>/ main:<p>     # per path
git hash-object -w manifest.json README.md; git update-index --add --cacheinfo …
git write-tree; git commit-tree <tree>                        # no parent
git push origin <commit>:refs/heads/state                     # create; never -f
```
