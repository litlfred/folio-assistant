---
# folio-assistant-fgnw
title: 'IN-PROGRESS CARRIES NO ACTIVITY: 43 of 60 claims untouched in 4h and no rule says what that means'
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
60 beans were `in-progress`; 43 had no change in the window, and 38 of those were last touched by one bulk move at 09:37. Eight sessions were active. So at most 17 claims corresponded to a session working them, and the status field cannot tell which.

## The gap
bean-coordination §"A claim is branch-local" says a claim announces rather than reserves; bean-blocking gives a *blocked* bean an expiry. An in-progress claim has none, so "in-progress" carries no information about activity, and a reviewer cannot tell a stalled agent from an abandoned claim.

## Done when
- [x] A rule states what an in-progress claim with no activity for N hours means, and who may act on it
- [x] `bun run health` (or the goal-review sweep) reports claims without activity in the window, as a finding a person acts on — it never changes a status itself

---

_2026-09-20T19:45Z_ — **Both Done-whens landed** (PR #589, issue #588).

`bean-coordination` §"A quiet claim — what `in-progress` does NOT tell you"
states the rule, and the rule is about a **signal rather than a clock**:

> A claim is LIVE when something outside the bean says so — an open PR naming
> it, an unmerged branch touching it, or a note since. A claim with none of
> those has announced nothing to anybody, and a claim that announces nothing
> does not reserve anything.

That falls straight out of §"A claim is branch-local": a claim becomes visible
to a sibling when the PR opens, so "claimed, no PR, no branch" is not a claim a
sibling could have seen even in principle. **Who may act**: any session may take
a quiet claim after checking for a liveness signal, saying in the bean that it
did; nothing re-statuses one automatically; and quiet is never evidence of
completion, so a quiet claim goes back to the pool rather than being closed.

`bun run health` reports `bean-quiet-claims` at **72 hours** since
`updated_at`, alongside `bean-claimed` as the denominator — *12 of 60* and *12*
are different findings, which is what this bean measured (43 of 60). Elapsed
time is the **fallback**, not the rule, because it is what a tool can compute
offline, and the threshold's `basis` says so: the count is an **upper bound**,
since a bean it lists may have an open PR the sweep cannot see.

A distinct metric from the existing `bean-stale-in-progress` at 14 days, not a
tighter version of it. Fourteen days asks whether a claim has been ABANDONED;
72 hours asks whether anybody is on it RIGHT NOW, which is what a session about
to pick up an item needs and what 14 days cannot answer. A bean over both
raises only the stronger finding.

Measured on this store, 2026-09-20: **74 claimed, 0 quiet, 0 stale** — so the
check locks in a property the store currently has rather than demanding work,
the same shape `check:bean-parents` documents. The 14-day finding's action text
was corrected in passing: it said "do not resolve a sibling's bean", which
contradicts the rule `0pes` settled.

_2026-09-20T21:15Z_ — **Closed.** Both Done-when boxes above are ticked against
the work recorded in this bean, and the status now says so.

**It should have said so an hour ago.** This bean was finished, its evidence
written into its own body, and left `in-progress` — while the session that left
it there was closing `bbbl`, whose entire subject is *a bean finished in its
body and left open*. Worse, the ticks were appended as a SECOND copy of the
checklist at the foot of the file, so the canonical `## Done when` still read
0 of 2 and any reader or tool consulting it saw an untouched bean.

