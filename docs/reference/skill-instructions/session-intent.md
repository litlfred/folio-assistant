---
layout: default
title: /session-intent
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/session-intent.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/session-intent.md) — do not edit here.

{% raw %}
# /session-intent — durable session intent + results

A coordination failure mode recurs whenever agents have no durable
record of which tasks are in flight, what each one has already
learned, or why a previous result was retracted: each new session
re-discovers the same near-result and re-commits it, only to retract
it again later. (A flip-flop episode — the same claim asserted and
withdrawn repeatedly across sessions — is the classic symptom.)

This skill enforces the **read → declare → work → record** loop so
the next session — possibly a different agent — picks up exactly
where the previous one left off.

## Where state lives

| Artifact | Purpose |
|---|---|
| [`STATUS.md`](../../../STATUS.md) | Always-current root dashboard: goals → master ledgers → active PRs |
| `docs/coordination/<goal>.md` | Per-goal **master ledger**: status table, open tasks, flip-flop history, session log |
| `.beans/` (via `beans` CLI) | Machine-readable **queue** of tasks, managed as hierarchical issues (Beans). |
| Per-PR body | Session intent at branch-open; EOS results appended |

## Session-start protocol (5 steps)

> Run these in order. Steps 1–3 are read-only; step 4 writes.

### 1. Read STATUS.md

Open [`STATUS.md`](../../../STATUS.md). Identify which goal row(s)
the user's current request touches. Note the active PRs column —
those are your siblings.

### 2. Read the goal's master ledger

Open `docs/coordination/<goal>.md`. Read:

- **Status table** — current canonical status of each subgoal /
  item. If a recent commit "resolved" something
  but the ledger says NOT resolved, **trust the ledger**: it's
  recording a retraction the commit doesn't reflect.
- **Flip-flop history** — every previous retraction, with the
  failure-mode signature. **Do not repeat any pattern listed here.**
- **Open tasks** — what's already in flight.
- **Session log** — what previous sessions on this goal did.

### 3. Read the queue

Use the `beans` CLI to list current tasks. Run `beans list` to find:

- **`todo` or `draft`** beans not yet picked up.
- **`blocked`** beans waiting on dependencies.
- Assignee: Check the bean body/comments to see if another agent is working on it. Multiple agents MAY pick the same item; coordinate with the user if you see this happen.

### 4. Declare intent (write)

Three places, all required:

**a. Master ledger session log** — append a row:

```markdown
| 2026-01-01 | Claude / `<branch>` | INTENT: <which task IDs from queue + what user asked> | (filled at EOS) |
```

**b. Beans CLI** — Create a parent session bean and child tasks.
- Create a session-level milestone/epic: `beans create "Session: <Branch/Goal>" --type milestone`
- For each task you pick up, create a child task and link it to the session bean:
  `beans create "<Task>" --type task`
  `beans update <child-id> --parent <session-id>`
  `beans update <child-id> --status in-progress`
If working on an existing bean, just run `beans update <id> --status in-progress --body-append "Claimed by <branch>"`

**c. PR body** — at branch-open, the PR body must include:

```markdown
## Intent (session start)
- <one line per task ID from queue you're working>
- <user's stated goal in their words>

## Session results
<filled at EOS>
```

### 5. Hand off to /coordinate

After step 4, run `/coordinate` to post intent on relevant sibling PRs
+ triage their review comments. Then start work.

## Session-end protocol (3 steps)

> Run these BEFORE pushing the final commit. The push triggers PR
> auto-subscription + sibling-coord sweep, so the EOS state must be
> visible from the push commit.

### 1. Update the queue

For each task you worked, use the `beans` CLI:

- If completed: `beans update <id> --status completed`. You should also add a summary comment using `beans update <id> --body-append "Completed with finding: ..."`.
- If partial: leave `status: in-progress`, but append a comment: `beans update <id> --body-append "Partial result: ..."`.
- If you discovered a NEW task: create a new bean via `beans create`.
- If you retract a previous claim: append the retraction to the ledger's flip-flop history (Stop Repeating Yourself).

### 2. Append results to the master ledger

The session log row from step 4a now gets its "RESULTS" column filled:

```markdown
| 2026-01-01 | Claude / `<branch>` | INTENT: task-foo-stability | RESULTS: confirmed expected behavior at all 3 anchors; appended new task `task-foo-followup` for follow-up. PR #1581 opened. |
```

If the session retracted a prior claim, add a row to the
**Flip-flop history** table with the retraction reason.

### 3. Update the PR body

Replace the placeholder `## Session results` section with:

```markdown
## Session results
- Picked up: <task IDs>
- Completed: <list>
- Partial: <list with where to pick up>
- New tasks added: <list>
- Retractions: <list of any prior-claim retractions>
- Open question for user: <if any>
```

## Multi-agent same-goal coordination

Per author directive: **multiple agents MAY attack
the same goal simultaneously**. The model is:

- **Goal** = product (user's directive).
- **Queue** = per-goal item list, all agents read + write.
- **Tasks are not exclusively claimed.** Two agents may pick the
  same task; this is allowed.
- **Coordination is with the USER on goal-level decisions**, not
  agent-to-agent on task-level locks.

When you discover a task you're working has been picked up by
another agent (`co_assignees` populated, or you see a sibling PR
commit touching the same scope):

1. **Do not silently abandon** — your independent attack is
   valuable (different methods may surface different findings).
2. **Post intent** on the sibling PR via `/coordinate` so the
   sibling agent sees you're also working it.
3. **Ask the user** if they want both threads or want one to
   stand down. Use `AskUserQuestion` with rich context (AGENTS.md
   §User accessibility). Sample:

   > 🟡 Two agents attacking task-foo-stability — sibling PR
   > #XXXX is at 50% with method A; I'd attack
   > with method B. Keep both threads?

4. **If user says one stands down**, the standing-down agent
   appends partial results to the ledger and updates queue
   `status: "open"` (releasing it).

## Hand-off pickup protocol

If you're the picking-up agent (someone else's `in-progress` task
or partial result):

1. Read the previous session log row in the ledger — that's the
   handoff letter.
2. Read the bean discussion/comments (`beans show <id>`) — that's the technical state.
3. Read the partial PR (if open) — that's the code state.
4. Declare your intent normally (create your session bean and append a comment to the existing bean).

## Anti-patterns

- ❌ Starting work without reading the ledger first ("just-the-prompt"
  agents miss retraction history and re-commit flipped claims).
- ❌ Claiming a task but not writing the EOS results ("silent abandon").
- ❌ Editing the queue file without also editing the ledger ("queue
  drift").
- ❌ Retracting a previous claim by quietly removing it from the queue
  without updating the flip-flop history ("erasure" — guaranteed to
  re-flip next session).
- ❌ Asking the user "should I pick this task?" — the queue is the
  authoritative list; just pick and declare.

## See also

- AGENTS.md §Agent work-plan policy (the work-plan source rule)
- AGENTS.md §Branch + PR workflow (the ALWAYS-PR rule)
- `coordinate.md` (sibling-PR coordination)
- `watch.md` (main-watching)
- `pending-show.md` (showing current pending)
{% endraw %}
