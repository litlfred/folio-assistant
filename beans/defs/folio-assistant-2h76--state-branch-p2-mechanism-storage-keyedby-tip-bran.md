---
# folio-assistant-2h76
title: 'STATE BRANCH P2: mechanism — storage keyedBy tip, branch-store splice-write, seed the orphan ''state'' branch, session-start mount at state/'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T10:58:10Z
updated_at: 2026-10-03T08:11:12Z
parent: folio-assistant-fs43
---

Serial, one agent. Reuses the 3fva spike 3ds9 write path (hash-object, mktree, commit-tree, push; never -f).

## Done when
- [x] schema field with keyedBy: tip
- [x] branch-store.ts with retry over a moved tip
- [x] state branch seeded with a hash-verified manifest (2026-10-02, see below)
- [x] session-start hook mounts state/ and fails LOUDLY when it cannot
- [x] bun run state:push
- [x] measured: two sessions editing the SAME bean concurrently — no lost edit
- [x] generic `branch-store mount --id <dir-id> [--into]` (replaces the single `state/` mount, owner ruling 2026-10-03): refuses loudly on corrupt or unknown, a miss is never an empty mount; wiring it into the session-start hook is left to each directory's cutover
- [x] generic `branch-store push --id <dir-id>` (replaces `state:push`): splices the mount's edits with `expect` from the mounted tip, so a concurrent edit to the same file is a `conflict`

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

## Mechanism complete 2026-10-03 — `claude/fs43-p2-state-store`, session `01EKB1gh`

Every line above is built and tested. **Nothing is live**: no declaration sets
`storage`, so `main` remains authoritative and the cutover is Phase 3 (`9ofm`).

| part | where |
|---|---|
| 1. extract the generic store | `TreeStore` in `branch-store.ts`; `qa-store`'s `Store` extends it |
| 2. `keyedBy: commit \| tip` | #1937 |
| 3. `state-store.ts` | declared tip-keyed directory, addressed by id |
| 4. session-start mount | `state-mount.ts`, wired into `session-start-coord-sweep.sh` |
| `state:push` | `state-push.ts` — splice, never a worktree push |

**Part 1 was left open by #1937 on purpose** — *"whether it adopts this one is
3fva's call"* — and the answer was yes. Measured before extracting: `must`
identical, `mktree`/`setPath` identical but for a `private`, and only
`fetchTip` genuinely different (candidate branch names, a superset). Net −77
lines across the two files, `qa-store`'s constructor signature unchanged, its
tests untouched.

**The "no lost edit" measurement, twice.** `state-store`'s `update()`
re-reads and re-applies on conflict, so two sessions appending to one bean both
land (asserted on the final blob). And `state-push` turns a dirty mount into a
SPLICE: a sibling's write to another file survives a push that never saw it —
a `git push` from the worktree would have reverted it — while a same-file
sibling is a `conflict` with the tip unmoved and the edit still on disk.

**Two things deliberately not done.** No declaration was flipped to
`keyedBy: "tip"`, and `.beans.yml` still points at `beans/defs` on `main`.
Doing either now would redirect every session's work-plan before the seed is
re-verified, which is `9ofm`'s job.


## Owner ruling 2026-10-03: ONE generic mount/push pair (asked by the 9c7h fsh-guts move, relayed by session 01CbYZTA; owner answered "1")

- **Shape:** `branch-store mount --id <dir-id> [--into <path>]` and `branch-store push --id <dir-id>`, keyed by DIRECTORY ID, so beans, todos and fsh-guts share one mechanism. A tip-SHA marker records what was mounted. Corrupt or unknown is refused loudly, and a miss is not an empty mount. `expect` comes from the recorded tip's blob ids, so concurrent edits produce a conflict, never an overwrite. A `storage.keyedBy: "tip"` directory resolves to its mount path, so readers stay unchanged. **This replaces this bean's single `state/` mount and `state:push`.**
- **Who:** built by the Parcel B session (session_01SmeBn6QZsDFaNQ4GtuC2sd) on a branch stacked on #1937, as its own PR into main that merges after #1937.

As built (`cat-harness/scripts/branch-store.ts`, tests `branch-mount.test.ts`, 11 on real git):
- the mount defaults to the declared path, so a reader finds the directory where it used to be;
- it is byte-safe (binary files and the executable mode survive);
- the marker is kept at `<git-common-dir>/branch-mounts/<id>.json`, outside the mount, so a reader walking the directory never sees it;
- it refuses a directory the checkout still tracks (no cutover yet), a non-empty non-mount, and a re-mount over unpushed edits;
- `push` honours the checkout's ignore rules for new files (fsh-guts/logs/ is never pushed), but not a rule that ignores the whole mount root;
- exit codes: mount refused 5; push conflict or refused 5, failed 6.
Mutation-checked: removing `expect`, the ignore filter or the byte-safety each turns a named test red.
