---
# folio-assistant-3ds9
title: 'SPIKE: can CI and a fresh agent container both push to and read an orphan qa-reports branch through the proxy?'
status: todo
type: task
priority: high
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:00:46Z
parent: folio-assistant-3fva
---

Arc `3fva`, proposal §4 item 1.2. **This spike can falsify part A**, so it goes before any mechanism is built.

Write path, as in lake-cache `cmd_seed`: hash-object, then mktree, then commit-tree, then push to a throwaway `qa-reports-spike`.
Read path: `git fetch --depth=1 --filter=blob:none origin +qa-reports-spike:refs/qa-reports-read`, then `git show`.

Measure:
- (1) push from a code-quality-gates job, with `contents: write`;
- (2) push from a fresh claude.ai/code container;
- (3) the read latency for one file and for all of `kg-qa/` from a cold container (budget: under 20 s added to `bun run gates`, proposal §6);
- (4) two concurrent writers to disjoint paths, both of which survive.

Delete the spike branch only on the owner's go (`deletion-requires-confirmation`).

## Done when
- [ ] (1)–(4) are measured, with the commands recorded
- [ ] a verdict is recorded against D1: branch confirmed, or a fallback medium is named
