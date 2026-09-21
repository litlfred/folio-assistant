---
# folio-assistant-rq8s
title: 'A SESSION BLOCKED ON THE OWNER IS INVISIBLE: four sessions held verbatim questions that only the session API could see, and nothing durable records one'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-21T06:30:04Z
updated_at: 2026-09-21T10:29:09Z
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

---

## 2026-09-21 ~10:30Z — re-measured on claiming, and **this bean's own evidence was stale within four hours**

Claimed and re-queried before writing anything up, because a six-hour-old
reading of a live system is a claim rather than a measurement. It did not
survive.

### The four this bean names are all WORKING

All seven `folio-assistant` sessions now read
`SESSION_STATUS_BUCKET_WORKING` with **0.0 hours idle**. The four recorded
above as "stopped, waiting on the owner" resumed on their own. Writing their
questions up would have reported a stale snapshot as current — the exact
failure `8nzu` is about, committed by its sibling bean.

### The API is LESS blind than this bean claims — two signals already exist

| signal | what it gives |
|---|---|
| `session_status: SESSION_STATUS_REQUIRES_ACTION` | **a distinct status**, not a bucket heuristic — the session is waiting on a person |
| `task_summary` | **the question, in plain text** |

So the premise *"exists only in a chat transcript"* is wrong for a session
that stopped properly. The thesis has to move, and it moves somewhere more
useful.

### What is actually missing: nothing AGES or AGGREGATES them

Live, across every repository this account can see:

| bucket | repo | idle | status | held question |
|---|---|---|---|---|
| BLOCKED | `qou` | **113.4 h (4.7 days)** | `REQUIRES_ACTION` | **"🟡 Which PRs should I merge? I've reviewed none of the maths in them."** |
| BLOCKED | `folio-assistant` | 113.2 h | `IDLE` | — |
| FAILED | `qou` | 110.5 h | `IDLE` | — (Axiom / Euler characteristic) |
| FAILED | `qou` | **385.3 h (16 days)** | `IDLE`, **`unread: true`** | — (q-Riemann hypothesis gaps) |
| FAILED | `qou` | **359.7 h (15 days)** | `IDLE`, **`unread: true`** | — (Q-Collatz gaps) |

**One session has held a direct question for 4.7 days**, in a status whose
whole meaning is *a person must act*, with the question sitting in a field any
reader can print. Nobody was told. Two more failed 15 and 16 days ago carrying
`unread: true` — output nobody has read.

`bean-blocking` requires a block to carry an **expiry**, because a block with
no expiry cannot be told from abandoned work. That rule is written for beans
and **the same defect is running unchecked one level up**, on sessions, where
the store already has both the status and the timestamp to compute it.

### The restated gap

> Not *"a blocked session is invisible"* — it is visible, in two fields, and
> nobody looks. **The signal exists and nothing watches it or ages it.**

That is a checker, not a discipline: `REQUIRES_ACTION` past a threshold, and
`FAILED` with `unread`, are both computable from what `list_sessions` already
returns. A rule asking agents to write their questions down would not have
found any of these five — four of them never asked one.

## Done when

- [ ] A check reports sessions in `REQUIRES_ACTION` past an idle threshold,
      and `FAILED` sessions carrying `unread`, with the threshold's **basis**
      stated the way `test/health/` requires rather than as a bare number
- [ ] The question in `task_summary` is printed with the finding — a count
      cannot be acted on, and this one is answerable in a sentence
- [ ] **Could-not-determine is never rendered as clean**: the session API is
      external, so a failed query is `unknown`, never "no blocked sessions"
- [ ] The five above are surfaced to the owner (done 2026-09-21; the `qou`
      one is a **math** question and this session has no `qou` access)
- [ ] The stale-snapshot lesson lands somewhere durable: this bean asserted a
      live-system reading as fact and it was false four hours later
