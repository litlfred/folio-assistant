---
# folio-assistant-cq1k
$schema: bean/1.0.0
title: 'Memory: Standing rule: if another agent''s PR/bean has had no work for more than 2 hours, a drain thread may take it over'
status: completed
type: task
priority: low
created_at: 2026-11-01T09:53:37Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `take-over-stalled-work.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Standing rule: if another agent's PR/bean has had no work for more than 2 hours, a drain thread may take it over


User 2026-11-01 09:53Z (cmsg_017WNUkNK8kdDziPK58Pv6G9WrvuQNcSAwzjvYeQYG6bup): "if stalled agent (no work > 2 hrs) take over". Applies to agy's and other threads' draft PRs and beans.

**Why:** drafts from agy and closed threads sat idle for a day, blocking the drain.

**How to apply:** check last commit/comment time; if older than 2h, take it over: update branch, mark ready, fix, and merge on green inside a merge window (functional only; content still needs explicit OK). Comment on the PR that you took it over. Still respect the scope split given by the coordinator (a thread actively owning it, even if quiet, may be named). See folio-assistant-wmmg, folio-assistant-8jbp, folio-assistant-9954.

2026-11-01 09:53:43Z (cmsg_017WNUkNK8kdDziPK58Pv6G98iUe1pbnreQDY5S7qcaRAP): "agy stalled 4 days". Treat every agy claim, bean and draft PR as free to take over (it overrides the skip-agy rule in folio-assistant-8jbp until agy is active again).
