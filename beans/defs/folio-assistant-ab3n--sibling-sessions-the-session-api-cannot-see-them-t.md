---
# folio-assistant-ab3n
title: 'SIBLING SESSIONS: the session API cannot see them, the commit trailer is the only identity, and nothing says so'
status: completed
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T21:15:00Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
Eight sibling sessions committed in the window (from the `Claude-Session:` trailer on 623 commits across all branches). The session API returned *not found* for all eight lookups by id, and its listing showed only the asking session for today. Nothing in AGENTS.md, bean-coordination or session-intent says how to enumerate the sessions working a repository.

## The gap
"Watch all open PRs for incoming insights" and "claim before you work" both assume an agent can see who else is working. Today the only durable session identity is the commit trailer, and the only state readable for a sibling is its branch and proposal. The `goal-review` skill records this as its §Sibling sessions; the general rule has no home.

## Done when
- [x] bean-coordination (or session-context) says where a sibling session is visible from, and that a session's state is *inferred* from its branch when the API cannot see it
- [x] A one-command sweep exists (a Tool node, not prose) that lists sessions in a window by trailer, with branch tips and first/last commit

---

_2026-09-20T19:45Z_ — **Both Done-whens landed** (PR #589, issue #588).

`bean-coordination` §"Where a sibling session is visible from (STRICT)" states
the rule this bean says has no home: a session is an ephemeral container,
nothing about it survives except what it committed, and the `Claude-Session:`
trailer is therefore the only durable session identity here. It carries the
boundary of the inference as a table — what a branch and a trailer DO tell you
against what they do not — and names the three states a checkout cannot
separate: **"stopped committing" is not "finished" and is not "abandoned"**.

`bun run sessions --since 4h` is the sweep, and it is a **Tool node**
(`tools/sessions.ts`, id `sibling-sessions`) rather than prose, which is what
this bean asked for. Its own module rather than a row in `tools/mcp.ts`: that
file is explicitly the twenty tools already served over MCP, regenerable from
`bun run mcp:capture`, and this one is hand-authored and not served.

It reads **all** branches, because a sibling's work is on ITS branch — exactly
where the asking session cannot see it by looking at its own history. Per
session it reports commit count, first and last commit, latest subject, and the
branches containing its tip. A window with no commits **exits non-zero** rather
than reporting "no siblings"; commits with no trailer are counted separately
rather than dropped.

Run here on a 1-day window it found **5 sessions over 688 commits**, 243 of
them untrailered — including three siblings active within the last hour, which
is the visibility this bean says did not exist.

`check:tools` refused the first draft twice, both times correctly: `satisfies`
named a skill that does not exist, and `since` was declared `Text`, which can
express a shell payload on a command line. The second is fixed the way this
repository prefers — a new `TimeWindow` type whose grammar admits a count with
a unit or an ISO date, so a payload is unrepresentable rather than rejected.

_2026-09-20T21:15Z_ — **Closed.** Both Done-when boxes above are ticked against
the work recorded in this bean, and the status now says so.

**It should have said so an hour ago.** This bean was finished, its evidence
written into its own body, and left `in-progress` — while the session that left
it there was closing `bbbl`, whose entire subject is *a bean finished in its
body and left open*. Worse, the ticks were appended as a SECOND copy of the
checklist at the foot of the file, so the canonical `## Done when` still read
0 of 2 and any reader or tool consulting it saw an untouched bean.


---

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5 — **a correction, not a reopening.***

This bean's title asserts *"the session API cannot see them"*. **Re-measured
2026-09-21: it can.** `list_sessions` returned **seven siblings** with their
`session_status`, and for those waiting, the question each was holding in
`task_summary` — plain text a commit trailer cannot carry at all.

The 2026-09-20 observation is not withdrawn: eight lookups by id did return
*not found* that day, and this bean's work stands on it. What is withdrawn is
the **present-tense claim** the title makes out of it, which is bean `8nzu`'s
whole subject — a dated observation welded to a capability claim outlives its
evidence, and every reader after that takes the claim rather than the date.

Acted on rather than only noted, because the claim had propagated into code:
`sibling-sessions.ts` **printed** *"The session API cannot see a sibling"* in
its own report. That line is corrected, and its header now says what is
actually durable — a commit trailer survives the container, so the tool is
right for *what did each session DO in this window* and wrong as the first
question for *who is here now*. `goal-review` axis 1 is corrected the same way:
ask the API first, fall back to trailers, `could not determine` if neither
answers.

**Left `completed`.** The work this bean did is done and correct; only a
sentence about the world aged. Closing or reopening a sibling's bean is not
this session's to do, and nothing here needs redoing.
