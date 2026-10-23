---
# folio-assistant-792f
$schema: bean/1.0.0
title: 'state:mount rewrites the .gitignore state-mounts block from STALE layer mounts, dropping graphs the pinned layers declare (seen: /merge-reviews/**)'
status: completed
type: bug
priority: normal
created_at: 2026-10-22T15:00:02Z
updated_at: 2026-10-22T17:07:00Z
parent: folio-assistant-fs43
---

`bun run cat state:mount -- --id beans` rewrites the `# BEGIN/END state mounts` block of the root `.gitignore` and drops `/merge-reviews/**`. This was seen twice on 2026-10-22, both times in a checkout at main `6be6532`'s ancestors. The diff each time was:

```
-/merge-reviews/**
```

Every agent that mounts beans then has a dirty tree it did not mean to make, and the stop hook asks it to commit. Committing would un-ignore a state mount on `main`.

Likely cause, not yet read in code: the block is regenerated from the graphs this mount resolved (here only `--id beans`, or the declarations in this checkout) rather than from every declared state graph, so `merge-reviews` (bean 30jr's merge queue) falls out.

## Done when

- [ ] `state:mount -- --id <one graph>` leaves `.gitignore` byte-identical when the declared set did not change
- [ ] a test mounts one graph and asserts the block still lists every declared state mount

_2026-10-22T16:05Z_ — Claimed by lane B2 (session_01Kymnx79TxWvxVoLzcAjBRr); fix in `cat-harness-tools/scripts/state-mount.ts`, PR on cat-harness-tools.

## Root cause, 2026-10-22T16:30Z — not `--id`

It does not reproduce with mounts that match `index.lock.json`: `state:mount -- --id beans` leaves `.gitignore` byte-identical (checked at main 1730012 plus #2623). `mountState` already rebuilds the block from the full declared set when `--id` narrows the mount (`syncStateIgnores(root, opts.id === undefined ? locations : tipLocations(root))`).

Both drops happened while this checkout's `cat-harness/` mount was OLDER than the lock's pin, after `main` moved and before `mount:lock` was re-run. `merge-reviews/` is declared by cat-harness#406 (e4362fc, 2026-10-21), so the stale declarations did not name it, and the block was rewritten without it.

The real defect is narrower: **`state:mount` rewrites a committed file from declarations it has not checked against the lock.** Without a warning, the checkout comes out dirty in a way that, committed, un-ignores a state mount on main.

## Done when (revised)

- [x] `state:mount` leaves the `.gitignore` block alone, and says why, when `mount:remote:check` is not clean (a layer mount does not hash to the lock)
- [x] a test with a stale layer mount asserts the block is unchanged

## 2026-10-22 — regression test merged (litlfred/cat-harness-tools#552, 92aef81)

Lane B2 added a test: mounting one graph keeps every declared graph's `.gitignore` line. On main the original symptom has not reproduced since 2026-10-15. The bean stays open for litlfred/cat-harness-tools#553 (session_01JkK6uP3iU2etyMbrw7v3cu), which fixes `state:mount --id` rewriting the block over stale layer mounts. Close it when #553 merges.

## Closed 2026-10-22 — #553 merged

litlfred/cat-harness-tools#553 merged as `bff395a` (owner: "yes, merge 553 when
green and repin"), all eight checks green. `staleLayerMounts` gates the `--id`
rewrite of the state-mounts block; its tests cover no lock, the stale states
(`missing`, `could-not-determine`) and the current ones. Pinned into
folio-assistant by litlfred/folio-assistant#2623. Session
https://claude.ai/code/session_01JkK6uP3iU2etyMbrw7v3cu.
