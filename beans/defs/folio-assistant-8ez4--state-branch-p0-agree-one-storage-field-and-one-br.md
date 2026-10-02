---
# folio-assistant-8ez4
title: 'STATE BRANCH P0: agree ONE storage field and ONE branch-store library with arc 3fva before either lands'
status: todo
type: task
created_at: 2026-10-02T10:58:09Z
updated_at: 2026-10-02T10:58:09Z
parent: folio-assistant-fs43
---

Arc 3fva proposes ContentDirectory.storage {branch, keyedBy: commit} for qa-reports. State needs keyedBy: tip (one living tree, splice-write, never -f). One field, one library — a second field over the same question is two answers free to disagree.

## Done when
- [ ] 3fva owner session consulted (PR #1764)
- [ ] field shape agreed: {branch, keyedBy: tip|commit, path}
- [ ] library API agreed: read / splice-write / retry

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md
