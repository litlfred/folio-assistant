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
