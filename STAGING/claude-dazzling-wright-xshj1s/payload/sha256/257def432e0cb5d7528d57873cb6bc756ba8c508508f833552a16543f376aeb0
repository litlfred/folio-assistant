---
# folio-assistant-8ez4
title: 'STATE BRANCH P0: agree ONE storage field and ONE branch-store library with arc 3fva before either lands'
status: completed
type: task
priority: normal
created_at: 2026-10-02T10:58:09Z
updated_at: 2026-10-06T06:26:35Z
parent: folio-assistant-fs43
---

Arc 3fva proposes ContentDirectory.storage {branch, keyedBy: commit} for qa-reports. State needs keyedBy: tip (one living tree, splice-write, never -f). One field, one library — a second field over the same question is two answers free to disagree.

## Done when
- [x] 3fva owner session consulted (PR #1764, comment 2026-10-02)
- [ ] field shape agreed: 3fva's {branch, keyedBy} widened to commit|tip, no path field (proposed on #1764; agreed when it lands without objection)
- [ ] library API agreed: extract qa-store's Store into branch-store.ts after #1764 lands (proposed on #1764)

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md


## Summary of Changes

**Closed on evidence, 2026-10-06** (re-measured on main at 2fdbb5109a by session_01QSd18GZBc9NJNMy6GV9v7D, not quoted from earlier notes). Status history: never completed before, so not an owner reopen; no holder.

Both proposals landed without objection on #1764. One field: `DirectoryStorageSchema.keyedBy` is the shared `KeyedBySchema` (subgraph-source.ts), strict, no path field. One library: qa-store's store extracted as `TreeStore` in branch-store.ts; `qa-store.ts`'s `Store` extends it (#1937, #1982). qa-store.test.ts passes.
