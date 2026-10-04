---
# folio-assistant-j5iq
title: 'merge-queue: document the author''s side of the handover (the PR is the message)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T06:46:45Z
updated_at: 2026-10-04T07:26:59Z
parent: folio-assistant-hfag
---

Owner, 2026-10-04: author sessions could not reliably reach the Merge Manager. Comments on #1959 (a merged, unrelated PR) and on #1800 reached nobody, and send_message cannot resolve the steward session from this account. Owner's ruling (option 1 of 3): add an author's-side section to merge-queue.md plus a pointer in prepare-merge. Beans and GitHub's native merge queue were evaluated and rejected for the ready signal (a bean is branch-local; the native queue is unavailable on a personal-account repo, bean 1hjm).

## Done when
- [x] merge-queue.md has §"Handing a PR to the queue — the author's side"
- [x] prepare-merge.md points to it from the end of the recipe
- [ ] skill:register:check and docs gates green

## Owner rulings 2026-10-04 (later the same day)

- *"beans are getting their own state branch cat/cat-harness/beans"*: after the fs43/9ofm cutover, queue entries and beans are read with `state:mount` and written with `state:push`. Before it, main is authoritative and the PR status comment is the live answer.
- *"dont waste CI cycles if lots of churn, wait until close to end of queue"*: sibling sessions stand still while far back (no hand merges, `merge-main` off) and catch up once when they are in the next train. A conflict is the exception.
- *"on Merge Manager side … communicate with them using the existing skills"*: the steward reaches a submitter near the front who has fallen behind through the edited-in-place status comment, a hand-back bean, and the direct-message fast path.
- Submitters are the `sibling-session` role; the Merge Manager is `merge-steward` (merge-train.bpmn).
- Related arc: 89cl (STATE BRANCH P5: adjust skills) should carry this section's state-branch paragraph forward at cutover.
