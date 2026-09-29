---
# folio-assistant-4dxv
title: 'goal-review axis 1: the session listing is ordered by CREATION, so a window filter must page until creation predates the window'
status: todo
type: task
priority: normal
created_at: 2026-09-24T12:20:12Z
updated_at: 2026-09-24T12:20:12Z
parent: folio-assistant-ahvw
---

Found 2026-09-24 in a 1-day goal review. The rule concerned is `goal-review` §"The six axes", axis 1 ("ASK THE SESSION API FIRST … List the sessions").

**Measured:** `list_sessions(mine, limit 40)` returned 40 sessions, 22 of them updated in the window, and `has_more: true`. The in-window rows were interleaved with sessions last active on 07-03, because the list is ordered by creation, not activity. Page 2 (60 more) had 0 in window. Stopping at the first page with no in-window row is right only because a session cannot be updated before it is created. The skill says none of this, so a reader either stops at page 1 or pages forever.

Two more practical facts belong in the skill: the listing is large (~75 KB per 40 sessions), so it must be parsed, not read; and the JSON sits inside an untrusted wrapper line.

## Done when
- [ ] axis 1 says the listing is creation-ordered, and when to stop paging (a whole page created before the window opened)
- [ ] it names `status_bucket` / `session_status` and `task_summary` as the fields to read, and says a REQUIRES_ACTION summary is a held question to quote
