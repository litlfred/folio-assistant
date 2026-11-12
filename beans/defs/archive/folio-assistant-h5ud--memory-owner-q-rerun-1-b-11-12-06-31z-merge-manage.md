---
# folio-assistant-h5ud
$schema: bean/1.0.0
title: 'Memory: Owner Q-RERUN-1 = B (11-12 06:31Z): merge manager re-runs CI only right before merging; never on held content; wait for GitHub healthy; refresh re-pi...'
status: completed
type: task
priority: low
created_at: 2026-11-12T06:31:33Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `rerun-policy.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Owner Q-RERUN-1 = B (11-12 06:31Z): merge manager re-runs CI only right before merging; never on held content; wait for GitHub healthy; refresh re-pin pins first

Owner card Q-RERUN-1 = B, tapped 2026-11-12 06:31Z in the CI-email thread (cmsg_017WNUkNK8kdDziPK58Pv6G96etWUsHcNFgYZFJZ29PDz9).

- Re-run a PR's CI only when that PR is about to merge (owner-tapped or non-content in a merge window, and everything else ready).
- Never re-run held content or committee PRs (smart-ra CS-, dth-*, anything without an owner tap).
- After a GitHub outage, wait until githubstatus.com reports healthy before re-running anything. No mass re-runs (outage.sh-style batches are retired).
- Before re-running a re-pin PR, first refresh its pins to the current mains, so lock-coherence doesn't fail again.
- The existing rule still holds: at most one re-run per job.

**Why:** 56 of the 120 failure emails on the night of 11-11 were Attempt #2/#3 re-runs. About 30 PRs were re-run at once around 22:00Z during the artifact outage, and every run emails the owner.
**How to apply:** check this before any rerun or rerun-failed-jobs call. update-branch also starts a run, so treat it the same way. Related: folio-assistant-36f6, folio-assistant-pblp, folio-assistant-fofz.
