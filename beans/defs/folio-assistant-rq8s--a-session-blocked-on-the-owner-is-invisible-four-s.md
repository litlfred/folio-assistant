---
# folio-assistant-rq8s
title: 'A SESSION BLOCKED ON THE OWNER IS INVISIBLE: four sessions held verbatim questions that only the session API could see, and nothing durable records one'
status: todo
type: bug
created_at: 2026-09-21T06:30:04Z
updated_at: 2026-09-21T06:30:04Z
parent: folio-assistant-ahvw
---


Found 2026-09-21 by the `goal-review` sweep of 2026-09-20T19:00Z →
2026-09-21T06:25Z (session_01AYHimvYMmf8h8e9fFN6dW5). An instruction gap, and
the sweep's headline finding.

## Measured

`list_sessions` returned **7 sibling sessions**. **Four of them were stopped,
waiting on the owner**, each holding a question in the owner's own terms:

| session | the question it is holding |
|---|---|
| WHO IRIS `docs-auto` | whether the generated URL keys on the instance **id** or its **path** |
| LHS navbar | Q12 — whether the instantiated-harness filter is applied |
| schema visualiser | `z634` / `s8nu` — strict published schemas, and the `.puml` disposition |
| beans dashboard | *"PR #655 green, awaiting merge"* |

Two of those four are **already beans** (`z634`, `s8nu`) and are therefore
durable. The other two exist **only in a chat transcript**, and the fourth is
not a question at all but a merge that nobody was told was ready.

## The gap

`bean-blocking` governs a **bean** that is blocked: what it waits on, since
when, its expiry, its handoff. Nothing governs a **session** that is blocked.
The two are different objects — a session can be stopped on a question about
work whose bean is not blocked, and this is exactly what happened.

So a session's pending question is durable only if its agent happened to
write it into a bean before stopping. Nothing says to, nothing checks, and the
agent that stops is the one least likely to.

## Why the usual answer does not cover it

*"Put it in the turn report"* — the turn report is chat, which is the thing
being escaped. *"Open an issue"* — `crdm-detect` forbids opening one without
permission, and an agent blocked on the owner does not have it. *"Use the
bean"* — correct where a bean exists, which was true for two of the four.

**And nothing aggregates.** Even with all four written down, the owner would
have to find four beans across 343 to learn that four sessions are waiting.
This sweep found them only because it queried the session API — which
`goal-review` §Axis 1 says not to rely on (bean `8nzu`).

## What it cost, stated plainly

The review was commissioned to answer *"what is next"*. The honest answer
turned out to be *"four decisions are already asked and unanswered"* — which
reframes the queue from work to decisions. A reader following the written
instructions would have reported a queue of work while four sessions sat
waiting.

## Done when

- [ ] A stopping agent that is blocked on the owner records the question
      somewhere durable, and the skill that says so is named here — whether
      that is `bean-blocking` extended to sessions, or a new one
- [ ] The owner can see every outstanding question in **one** place without
      reading 343 beans or seven transcripts — the surface is chosen, with
      the reason, rather than defaulted to "a bean"
- [ ] The question carries its session id, so answering it can reach the
      agent that asked rather than a fresh one re-deriving the context
- [ ] The four above are surfaced to the owner (this bean does not answer
      them, and two belong to `z634` / `s8nu`)
