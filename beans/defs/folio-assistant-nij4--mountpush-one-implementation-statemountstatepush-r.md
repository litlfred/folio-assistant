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
- [x] one mount and one push implementation on main, reached through `state:mount` / `state:push`
- [x] binary files, modes and symlinks round-trip through those commands (tests on real git)
- [x] the source kind is read from the declaration, never assumed
- [x] #1989's author agrees on its disposition — moot: #1989 MERGED before this landed, so its byte/mode fix shipped and is now superseded rather than abandoned

## Built 2026-10-03 (Parcel B session, #1997)
- `state-mount.ts` no longer checks out a `state/` worktree. It enumerates every declared directory through `declaredSubgraph` and dispatches on `source.kind`: `directory` is skipped; `branch` keyed by `tip` is mounted through `mountTip` at the declared path; `branch` keyed by `commit` is qa-store's and is skipped; any other kind is refused loudly. The loud report, the exit 1 on failure, exit 0 for `not-enabled`, and leaving a dirty mount untouched are all kept.
- **Found while building it:** `tipLocations` reads only the legacy `storage` field. A subgraph declared the current way (`source: { kind: "branch" }`) is INVISIBLE to it, and to `resolveTipLocation`, which `branch-store mount --id` uses. The `state:` commands avoid it by asking `declaredSubgraph`. The `branch-store` CLI still has the gap.
- `state-push.ts` pushes every id with a mount marker in this worktree, through `pushMount`. It uses the markers, not the declarations, so removing a declaration cannot strand unpushed edits.
- branch-store gains `mountedIds` and `mountChanges`; nothing was copied.
- Tests: 11 mount tests and 8 push tests on real git, through a shared `tests/state-fixture.ts` that declares the subgraph with `source`. They include a new binary, an executable bit and a symlink pushed and then mounted back in a second container.
- Gotcha recorded for the next agent: a statement beginning `declare(` is stripped by Bun's TypeScript transpiler as an ambient declaration, so the fixture's helper is `writeDeclaration`.
