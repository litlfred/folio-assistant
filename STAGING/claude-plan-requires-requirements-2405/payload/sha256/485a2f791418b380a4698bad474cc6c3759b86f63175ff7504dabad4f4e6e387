---
# folio-assistant-h8ig
title: beans:claim must write the claim through the branch store — after the cutover claiming is impossible, not just unsafe
status: todo
type: task
priority: high
created_at: 2026-10-04T07:12:15Z
updated_at: 2026-10-04T07:12:15Z
parent: folio-assistant-fs43
---

**This is the last hard blocker on the cutover (`p3ny`), and it was created by the fix for the previous one.**

#2042 made `claim-bean` REFUSE once the bean graph is cut over, and that was the right call: pushing a claim to a default branch that no longer holds the store would land it where no reader looks, which is `35nj`'s measured failure (two sessions, 61 seconds apart, two PRs for one bean) with the guard against it reporting success. Its own words, on `main`:

> the bean store is cut over to its branch and mounted at …, so pushing a claim to the default branch would land it where no reader looks. Claim through the branch store instead (bean 9ofm: **this script's own migration row is still open**).

So after the cutover `bun run beans:claim <id>` returns `unknown` for **every** session. `AGENTS.md` and `bean-coordination` both require a claim before durable work, and the session-start sweep tells an agent to claim one. A repository where claiming is impossible is worse than one where it races: the race is visible and recoverable, the refusal makes every session either stop or work unclaimed — which is the 2026-09-18 failure (two merged PRs' worth of work, unclaimed) by construction rather than by oversight.

## What the writer has to do

The mechanism exists; nothing wires the claim to it.

- `StateStore` (`cat-harness/scripts/state-store.ts`) already does tip-keyed read + splice-write over `branch-store`, addressed by DIRECTORY ID, and its `update()` re-reads and re-applies on conflict — measured in `2h76` as "two sessions appending to one bean both land".
- So a claim becomes: read the bean from the tip, refuse if it is already held (the `already-claimed` arm, unchanged), splice the status and the holder note, push with `expect`. A same-bean sibling is then a `conflict` — which is the honest answer and is what `already-claimed` wants anyway.
- `claim-bean`'s seven states (`pushed`, `already-claimed`, `held-unknown`, `already-closed`, `new-on-branch`, `fell-back`, `unknown`) mostly carry over. `fell-back` is the one to think about: it means "the push to the default branch was refused, the claim is on this branch only". Against the bean branch the equivalent is a refused push to `cat/cat-harness/beans`, and D2 (a) says fall back to carrying the edit on the PR branch — but after the cutover the PR branch has no `beans/` to carry it in. **That is a real design question, not a port**, and it should be answered before the cutover rather than discovered after.

## Why it is not just "do the same thing to another ref"

A claim pushed to `main` today is a commit on a branch every session already fetches. A claim on the bean branch is a splice onto a tip, and the thing that makes a claim useful is that a SIBLING reads it within seconds. So the writer's correctness depends on the reader being mounted and reasonably fresh — and a mount is read at a tip and does not move until it is re-mounted (`MountMarker.tip`, by design, so a push cannot land on top of unread siblings). A session that mounted an hour ago reads an hour-old work plan. Whether `beans:claim` should re-mount, read the tip directly past the mount, or report the mount's age is the second question to settle.

## Done when

- [ ] `beans:claim` writes through `StateStore`/`branch-store push` when the graph is cut over, and still pushes to the default branch while it is not
- [ ] the `fell-back` state has an answer that does not assume the PR branch can hold the bean
- [ ] staleness: a claim read against a mount says how old the mount is, or re-reads the tip — decided, not left implicit
- [ ] measured as `2h76` measured its sibling case: two sessions claiming the same bean, and neither claim lost nor both reported success
