---
# folio-assistant-rq8s
title: 'A SESSION BLOCKED ON THE OWNER IS INVISIBLE: four sessions held verbatim questions that only the session API could see, and nothing durable records one'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-21T06:30:04Z
updated_at: 2026-09-22T18:54:19Z
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

## Built, 2026-09-21 — and it is deliberately NOT a gate

`bun run check:session-staleness <listing.json>` (or piped on stdin), rules in
`src/sessions/staleness.ts`, 17 tests of which **5 go red when the rules are
stubbed**.

**It takes the listing as input and does not fetch it, and that is the finding
rather than a shortcut.** Probed from inside a session container: no session
credential in the environment, `api.anthropic.com/v1/sessions` → **401**,
`claude.ai/api/code/sessions` → **403**. `list_sessions` is an MCP tool an
AGENT holds, not an endpoint a script can call — the same wall that made
`sibling-sessions.ts` infer sessions from commit trailers.

So **this must never be wired into `code-quality-gates.yml`**. A gate whose
input CI cannot obtain examines nothing and reports a clean run over
everything: the `dh4f` defect, in the check written to stop a
clean-run-over-nothing one level up. It belongs in the session-start sweep,
run by an agent that can produce the listing.

### Three classes, because two would have lied

| class | rule | measured |
|---|---|---|
| waiting on a person | `REQUIRES_ACTION` past **72 h** | 1 — held a question for 113.6 h |
| unread failure | `FAILED` + `unread` past **24 h** | 2 — at 359.9 h and 385.5 h |
| **stopped, undeclared** | `BLOCKED` bucket, status NOT `REQUIRES_ACTION`, past 72 h | 1 — at 113.4 h |

The third class is the one that makes this honest. A session whose coarse
bucket says `BLOCKED` while its precise status says `IDLE` recorded no
question and never declared that a person must act: **waiting and abandoned
cannot be told apart from the listing**, so it is NAMED and never counted
among the sessions waiting on somebody. Dropping it silently was the
alternative, and it is the `dh4f` shape.

A `FAILED` session somebody has already **read** is not reported at all —
they know, and reporting it would make every historical failure permanent
noise.

### Thresholds carry a basis, not a number

**72 h** is `BEAN_QUIET_HOURS` from `test/health/checks.ts`, set by bean
`fgnw` for *"is anybody on this RIGHT NOW"* — a session waiting on a person
asks the same question from the other side, so it takes the same calibration
rather than one invented here, and a weekend cannot produce a finding on its
own. **24 h** is deliberately shorter and is NOT a tighter version of the same
judgement: a session waiting on a person may legitimately wait, while one that
FAILED with unread output is not waiting on anything — the only question is
whether anybody noticed.

### Found by its own first run

The argument parser excluded the first positional argument whenever `--repo`
was absent (`repoAt` is `-1`, so `repoAt + 1` is `0`), fell through to reading
stdin, and hung. Fixed, with the reason at the call site.

## Done when

- [x] A check reports sessions in `REQUIRES_ACTION` past an idle threshold,
      and `FAILED` sessions carrying `unread`, with each threshold's **basis**
      stated rather than a bare number
- [x] The question in `task_summary` is printed with the finding
- [x] **Could-not-determine is never rendered as clean** — an unreadable or
      arrayless payload is `unknown` and exits non-zero, and a row with no
      usable timestamp is skipped rather than read as fresh
- [x] The five are surfaced to the owner, with links (2026-09-21)
- [ ] The session-start sweep runs it, which needs the agent-side fetch wired
      in — `session-start-coord-sweep.sh` calls scripts, and this one needs a
      listing piped to it
- [ ] The owner's four `qou` items are theirs: **this session works
      folio-assistant only, on their instruction, and has no `qou` access**,
      so no bean could be left there. Recorded here instead

---

## 2026-09-22 — the sweep now asks for it, and the check was run live

### The remaining box, and why it could not be "wire in a fetch"

`session-start-coord-sweep.sh` gains **§"Sibling sessions waiting on a person"**.
It does **not** fetch the listing, and the section says so in its first line:
the 401/403 probe above is quoted in place, so the next reader sees why the
input is asked for by name rather than obtained. A fetch wired into a shell
that cannot authenticate would examine nothing and report every session clean —
the `dh4f` defect, in the tool written to stop one.

The section carries the exact call (`list_sessions`, `mine: true`, `limit: 50`),
the pipe, the three classes with their bases, and the rule that **not running it
is `unknown`, never "none waiting"**. It is also step 4 of the recommended
actions, named as *the only step whose input this script cannot produce, so the
only one that silently reports nothing when skipped*.

Same shape as §"Running processes", which is the precedent: the sweep cannot
decide it, so it makes sure the question is put.

### Run live from this session, 2026-09-22T18:5xZ — and it fires

`list_sessions` (mine, 50) → `bun run check:session-staleness`, **50 sessions
read**, exit 1:

```
✗ litlfred/qou — FAILED 190.3h ago (7.9 days) with output nobody has read: Universal triangulation and binding gap
✗ litlfred/qou — FAILED 190.3h ago (7.9 days) with output nobody has read: Dark matter and antimatter feasibility
✗ litlfred/qou — FAILED 167.9h ago (7.0 days) with output nobody has read: 1D mechanics framework in QOU
✗ litlfred/qou — FAILED 167.3h ago (7.0 days) with output nobody has read: 8-fold way derivation from QOU
```

**Four unread failures in `litlfred/qou`, 7–7.9 days old.** Zero sessions in
`REQUIRES_ACTION` past 72 h and none in the stopped-undeclared class, so the
report is four findings of one class rather than a wall.

Two things about this reading, both stated rather than smoothed:

- **The window is 50 sessions, newest first.** The q-Riemann and Q-Collatz
  failures this bean recorded on 2026-09-21 at 359 h and 385 h are **not** in
  the output, and the listing cannot distinguish *"somebody read them"* from
  *"they fell outside the window"*. A larger `limit` answers it; this run did
  not ask one.
- **All four are `qou`, which is a MATH repository and not this session's.**
  This session has no `qou` access and opens nothing there — recorded here, and
  surfaced to the owner on #956, exactly as the four before them were.

### The compliance ceiling is stated rather than claimed away

This is a rule in prose asking an agent to make a tool call. `1xhc`'s thesis
says such a rule has a ceiling nobody measures, and nothing here measures it:
a session that skips step 4 leaves no trace, and the next sweep cannot tell
that from a clean run. Making it measurable means a durable record of *when a
listing was last read*, which is a new `state` artefact and a declaration
decision — **put to the owner rather than invented here.**

## Done when

- [x] A check reports sessions in `REQUIRES_ACTION` past an idle threshold,
      and `FAILED` sessions carrying `unread`, with each threshold's **basis**
      stated rather than a bare number
- [x] The question in `task_summary` is printed with the finding
- [x] **Could-not-determine is never rendered as clean**
- [x] The five are surfaced to the owner, with links (2026-09-21)
- [x] The session-start sweep runs it — §"Sibling sessions waiting on a person"
      names the call, the pipe and the three classes, and says that skipping it
      is `unknown` rather than none. It asks for the input rather than fetching
      it, and the 401/403 probe is quoted in place so the next reader does not
      "fix" that by wiring a fetch in.
- [ ] The owner's `qou` items are theirs: this session works folio-assistant
      only and has no `qou` access. Four fresh unread failures (7–7.9 days)
      surfaced on #956 2026-09-22.
- [ ] **Owner decision:** whether the skip should leave a durable trace, which
      needs a new `state` artefact and a declaration. Not invented here.
