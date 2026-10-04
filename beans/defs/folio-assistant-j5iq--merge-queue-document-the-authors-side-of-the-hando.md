---
# folio-assistant-j5iq
title: 'merge-queue: document the author''s side of the handover (the PR is the message)'
status: in-progress
type: task
created_at: 2026-10-04T06:46:45Z
updated_at: 2026-10-04T06:46:45Z
parent: folio-assistant-hfag
---

Owner, 2026-10-04: author sessions could not reliably reach the Merge Manager. Comments on #1959 (a merged, unrelated PR) and on #1800 reached nobody, and send_message cannot resolve the steward session from this account. Owner's ruling (option 1 of 3): add an author's-side section to merge-queue.md plus a pointer in prepare-merge. Beans and GitHub's native merge queue were evaluated and rejected for the ready signal (a bean is branch-local; the native queue is unavailable on a personal-account repo, bean 1hjm).

## Done when
- [x] merge-queue.md has §"Handing a PR to the queue — the author's side"
- [x] prepare-merge.md points to it from the end of the recipe
- [ ] skill:register:check and docs gates green
