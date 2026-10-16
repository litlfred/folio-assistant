---
# folio-assistant-qump
title: 'REMOTE MOUNT BOOTSTRAP: mount:remote cannot read a declaration whose kinds come from the closure it is about to mount'
status: completed
type: bug
priority: high
created_at: 2026-10-09T19:00:00Z
updated_at: 2026-10-10T12:00:00Z
parent: folio-assistant-iirv
---

Found 2026-10-09 while building who-iris's site in an isolated tree (who-iris
clone + cat-harness at its lock ref + bootstrap-tools as a sibling, nothing else).

## What happens

`bun run <cat-harness>/scripts/remote-mount.ts` from a fresh who-iris clone:

> 🛑 could-not-determine — who-iris.json: directory "who-iris-catalogue" declares
> unknown graph typology "catalogue" … A kind contributed by a dependency must be
> registered before the declaration is read.

`catalogue` is folio-assistant-core's kind, and core is one of the instances this
very mount would lay down. Reading the declaration needs the closure; mounting the
closure needs the declaration. It worked in this container only because `/home/user`
happened to hold a folio-assistant-core checkout beside who-iris, which the registry
scanned — so the publish Routine (`trig_01XYFY6eELcR6tucz9UnjdaT`, step 2) has never
been shown to work from a clean container, and would stop at its first step there.

## The shape of the fix (not decided)

Mount reads only what mounting needs — `name`, `needs`, `remoteMounts`/the lock,
`index.config.json` — with a reader that does not validate kinds; full validation
runs AFTER the closure is on disk, when every kind's owner is registered. The
lock already records each instance's declaration digest, so the second read can be
checked against the first.

## Done when
- [x] from an EMPTY directory: clone who-iris, clone cat-harness at the lock ref, run
      `remote-mount.ts` — it mounts, with no sibling checkout anywhere above it
- [x] a test with a fixture whose root declaration uses a kind only a mounted layer registers

## 2026-10-10 — fixed: cat-harness #87 (b27a4da), cat-harness-tools #33 (c6dd270)

**Re-measured first, at who-iris 748c238.** In an empty directory: who-iris, plus cat-harness ffad8df, cat-harness-tools abadba3 and bootstrap-tools at the lock refs, and no core anywhere. It still failed: exit 2, `directory "who-iris-catalogue" declares unknown graph typology "catalogue"`.

**The fix is the shape above.**
- The harness gains `readMountFields`: `name`, `remoteMounts`, `mountApprovers` and `directories[].path`, read structurally. This is how the planner already reads an upstream.
- `readDeclaredMounts`, `writeDeclaredMounts` and remote-mount's downstream reads go through it.
- Full validation is left to the checks that run once the closure is on disk.

**Verified in the same empty directory with both fixes applied.**
- The mount exits 0, and `index.lock.json` is byte-identical to the committed one.
- The five who-iris gates exit 0, and 97/97 tests pass.
- All 106 `:check` scripts exit identically before and after.
- New tests in `index-config.test.ts` assert that the full read throws on the unregistered kind while the mounts are still read.

**Box 1 stays open until who-iris's lock pins cat-harness ≥ b27a4da and cat-harness-tools ≥ c6dd270.** Until then, a sibling cloned "at the lock ref" is the unfixed revision. That repin is a pin move, so it needs the owner's consent (H8).

## 2026-10-10 — closed: who-iris repinned (who-iris #28, c8bfb7c)

Repinned on the owner's "Go": cat-harness b27a4da, cat-harness-tools c6dd270. Box 1 was then measured exactly as written: an empty directory, a who-iris clone, and siblings cloned at the lock refs, with no core anywhere. The mount exits 0 and writes the committed `index.lock.json` byte for byte. The five gates exit 0 and 97/97 tests pass.
