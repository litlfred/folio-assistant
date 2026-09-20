---
# folio-assistant-ab3n
title: 'SIBLING SESSIONS: the session API cannot see them, the commit trailer is the only identity, and nothing says so'
status: todo
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T18:05:19Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
Eight sibling sessions committed in the window (from the `Claude-Session:` trailer on 623 commits across all branches). The session API returned *not found* for all eight lookups by id, and its listing showed only the asking session for today. Nothing in AGENTS.md, bean-coordination or session-intent says how to enumerate the sessions working a repository.

## The gap
"Watch all open PRs for incoming insights" and "claim before you work" both assume an agent can see who else is working. Today the only durable session identity is the commit trailer, and the only state readable for a sibling is its branch and proposal. The `goal-review` skill records this as its §Sibling sessions; the general rule has no home.

## Done when
- [ ] bean-coordination (or session-context) says where a sibling session is visible from, and that a session's state is *inferred* from its branch when the API cannot see it
- [ ] A one-command sweep exists (a Tool node, not prose) that lists sessions in a window by trailer, with branch tips and first/last commit
