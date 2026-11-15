---
# note on folio-assistant-2h76 from claude/state-mount-per-branch-2h76
$schema: folio-bean-note/v1
bean: folio-assistant-2h76
branch: "claude/state-mount-per-branch-2h76"
created: "2026-10-03"
---
## D4 option (b): state:mount and state:push fan out over every declared tip-keyed graph (PR #2001)

## D4 option (b) is implemented: the mount and the push fan out

PR #2001, against the acceptance list in the 2026-10-03 ruling note
(`folio-assistant-2h76--2026-10-03--claude-festive-galileo-s7ibx0.md`).

| acceptance item | state |
|---|---|
| `mountState` mounts per declared tip-keyed directory, from its own branch, at its own declared path; the `branches.length > 1` refusal goes | done |
| the multi-branch case has a test that FAILS against today's code | done — 7 of 10 failing before, 18 passing after |
| `state:push` splices back per branch, not to one | done |
| a mount that fails for ONE graph is still a loud finding and does not report the others clean (`1xhc`) | done — `partial`, exit 1 |
| the ruling is reflected in the proposal's §6 D4 row as a dated amendment | done |

## What the change actually is

**Only the fan-out.** The per-directory mount and push already existed on
`main` as `mountTip` / `pushMount` in `branch-store.ts` (#1957), with their own
exit-code vocabulary and a per-worktree marker, reachable by hand as
`branch-store.ts mount --id <directory-id>`. Neither is reimplemented here;
each is called once per declared directory and the results are aggregated.

Two things measured along the way that contradict how the task was framed:

- **A mount per branch was not unbuilt.** `state-mount.ts`'s refusal said *"a
  branch per graph (D4 option b) needs a mount per branch, which is not
  built"*, but what was missing was the *iteration*, not the mount.
- **The single `MOUNT_REF` constant was not the obstacle it looked like.** It
  would indeed have collided across branches, but the collision does not arise
  on the fan-out path: `mountTip` reaches a branch through `BranchStore`, whose
  `privateRef` is `refs/<ns>/<kind>/<pid>-<seq>`, unique per process *and* per
  call. No new ref scheme was needed.

## The three answers the aggregate keeps apart (`1xhc`)

`not-enabled` (quiet, exit 0) · `mounted` (every graph present, exit 0) ·
`partial` (some present, the failures named, **exit 1**) · `failed` (none
present, or the declarations could not be read, **exit 1**). A failing graph
never stops its siblings mounting, a throw for one graph is caught, and
`mountTip`'s `miss` / `corrupt` / `unknown` are carried through verbatim so
"could not ask" never reads as determined-absent. The report also says what
*did* mount, because a partial is not a rollback.

`stale` is deliberately not a failure: a prior mount holding unpushed edits is
left untouched, so that graph is still on disk and readable — the per-graph
form of the existing `dirty` state, and for the same reason.

## Still inert

No declaration sets `storage.keyedBy: "tip"`, and this PR adds none — that is
Phase 3 (bean `9ofm`) and would change what every reader resolves. The
session-start sweep still reports *"nothing to mount"* and exits 0.

`cat/cat-harness/state` is untouched: superseded under option (b), and
retiring the name is bean `oycs` (`deletion-requires-confirmation`).

## Relation to bean `nij4` (#1997)

`nij4` consolidates the two mount/push implementations on `main` onto
`mountTip`/`pushMount` and dispatches on `declaredSubgraph(...).source.kind`.
It is blocked on #1987, which is still open — measured: `declaredSubgraph` with
a `.source.kind` is not on `main` — and its diff is one bean file.

**The acceptance lists are disjoint**: none of `nij4`'s four items is the
fan-out, and this PR adds none of `nij4`'s. #2001's loop is written against the
`mountTip`/`pushMount` surface `nij4` is converging on, and the pre-ruling
whole-branch worktree is isolated in `mountSingleWorktree` (reachable only by
`--force` with nothing declared, the cutover's path) so `nij4`'s remaining work
is a clean subtraction rather than a merge. Coordination note posted on #1997.
