---
# folio-assistant-nij4
title: 'MOUNT/PUSH: one implementation — state:mount/state:push rebuilt on branch-store''s byte- and mode-preserving mount/push, dispatching on the declared subgraph source'
status: in-progress
type: task
created_at: 2026-10-03T13:50:12Z
updated_at: 2026-10-03T13:50:12Z
parent: folio-assistant-fs43
---

Owner ruling 2026-10-03 (option 1 of 4, asked by the Parcel B session): main carries TWO mount/push implementations after #1982 and #1957 both merged — `state-mount.ts`/`state-push.ts` (#1982; reads the mount as utf-8 text, so binary files are corrupted and modes/symlinks lost, fixed separately by #1989) and `branch-store.ts mount --id`/`push --id` (#1957; bytes, modes and symlinks round-trip, 15 tests on real git). Keep ONE.

## Plan
- Keep the `state:mount` / `state:push` COMMANDS (they are the surface session start and agents already use).
- Rebuild them on branch-store's `mountTip` / `pushMount` (and its per-worktree marker), so there is one write path.
- Dispatch on `declaredSubgraph(root, id).source.kind` (#1987): `directory` = no-op, `branch` = tip mount, unknown kind refused — once #1987 is on main.
- Remove the duplicated code; #1989 becomes unnecessary (coordinate with its author, 01EKB1gh, before closing anything).

## Done when
- [ ] one mount and one push implementation on main, reached through `state:mount` / `state:push`
- [ ] binary files, modes and symlinks round-trip through those commands (tests on real git)
- [ ] the source kind is read from the declaration, never assumed
- [ ] #1989's author agrees on its disposition
