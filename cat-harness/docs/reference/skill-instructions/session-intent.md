---
layout: default
title: '/session-intent'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/session-intent.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/session-intent.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/session-intent.md){: .fa-edit-source }

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

**The ledger half of this skill named two paths that do not exist here**, and
an agent following it stopped at step 1. Bean `z9eb`, measured 2026-09-20:
`ls STATUS.md` and `ls docs/coordination/` both fail. The model came from
another folio and was never re-homed when this instance moved its work plan
into `beans/`. The queue half was right all along; only the ledger half
pointed at nothing.

**Where the ledger's four jobs actually live now**, each in the object that
already owns it:

| the ledger's job | here |
|---|---|
| goals, and what serves each | a `milestone` bean per goal, with the epics parented to it — [`todo-manager`](todo-manager.md) §"A GOAL is a `milestone` bean"; `beans roadmap` renders it |
| canonical status of an item | the bean itself. There is no second copy to disagree with it, which is what the "trust the ledger" rule existed to arbitrate |
| flip-flop history | a `scrapped` bean keeps the rejected approach *with its reasons*, and a `trap` node under the declared `memory` graph keeps the failure signature — [`agent-memory`](agent-memory.md) |
| session log | the bean's body notes, plus the PR. Both are durable and both are read by the next session; a third place would be a third answer |

| Artifact | Purpose |
|---|---|
| `beans/` (via the `beans` CLI) | the **queue** and the **plan**: goals as milestones, epics, tasks |
| `memory/` | established facts and TRAPs — what not to re-derive, and what not to repeat |
| Per-PR body | session intent at branch-open; EOS results appended |
| a root dashboard file | **optional, and this instance has none.** See below |

### The dashboard is optional, and absent is not undetermined

An instance MAY keep a `STATUS.md`-style dashboard, and some folios do. This
one does not, and that is a **determined absence** rather than a gap: the
milestones and `beans roadmap` answer the same question from the store, so a
dashboard here would be a second copy free to drift from it.

Three states, and the third is the one that gets collapsed:

1. **A dashboard exists** → read it first, as step 1 below.
2. **No dashboard, and the work plan reads** → skip to the roadmap. Nothing is
   missing.
3. **The work plan could not be read** — no CLI, no store, an unreadable
   declaration → **that is not an empty plan.** Say so and fix it before
   declaring intent; [`todo-manager`](todo-manager.md) §"When the `beans` CLI
   is not there" has the fallback, which writes as well as reads.

## Session-start protocol (5 steps)

> Run these in order. Steps 1–3 are read-only; step 4 writes.

### 1. Read the goals

`beans roadmap`, or `beans list` filtered to `--type milestone`. Identify which
goal the user's request serves. A request that serves none is not thereby
illegitimate — it is a finding worth one line in the turn report, and possibly
a new milestone.

Then find your siblings: the open PRs, and the `Claude-Session:` trailer on
recent commits. **The session API cannot see sibling sessions** — bean `ab3n` —
so a branch and its PR are the only durable evidence that another session is
working.

### 2. Read the goal's epics and their open children

Walk down from the milestone: `beans list` and read the epics parented to it,
then their open children.

- **Status** — the bean's own `status` is canonical. There is no second copy,
  so there is nothing to arbitrate against it.
- **What was rejected** — read the `scrapped` beans in the archive before
  proposing an approach. That is what stops you re-entering a dead end, and it
  is why `AGENTS.md` forbids deleting one.
- **Traps** — the `memory` graph's `trap` nodes carry failure signatures.
  **Do not repeat any pattern recorded there.**
- **What is in flight** — an `in-progress` bean, with the caveat that a claim
  is branch-local and announces rather than reserves
  ([`bean-coordination`](bean-coordination.md)).

### 3. Read the queue

Use the `beans` CLI to list current tasks. Run `beans list` to find:

- **`todo` or `draft`** beans not yet picked up.
- **`blocked`** beans waiting on dependencies.
- Assignee: Check the bean body/comments to see if another agent is working on it. Multiple agents MAY pick the same item; coordinate with the user if you see this happen.

### 4. Declare intent (write)

Three places, all required:

**a. The bean, not a ledger** — append your intent to the bean you are working,
naming your branch:

```sh
beans update <id> --status in-progress
```

then append a note to its body saying what you intend and where you got to.
The bean is the durable record a sibling reads; there is no separate session
log to keep in step with it.

**b. Beans CLI** — Create a parent session bean and child tasks.

> **Check before you create (STRICT).** `beans create` is not idempotent — it
> mints a fresh ID every call and dedupes on nothing, so re-entering this step
> duplicates the whole plan rather than no-op'ing. Run the existence check in
> [`todo-manager.md` §Check before you create](todo-manager.md) before **every**
> `beans create` below, the session milestone included. An unguarded re-run of
> exactly this step produced 14,688 duplicate beans in one folio on 2026-08-04.

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

### 2. Record the results where they will be read

Append them to the **bean**, which is where step 4a put the intent — what was
confirmed, what remains, and the PR. One object, opened and closed, rather than
an intent in one place and a result in another.

If the session **retracted** a prior claim, that is not a body note. Two
objects carry it, and they answer different questions:

- the approach that was rejected becomes a `scrapped` bean **with its
  reasons**, so the next agent does not re-enter it;
- the failure *signature* — what made the wrong answer look right — becomes a
  `trap` node in the `memory` graph ([`agent-memory`](agent-memory.md)), which
  is what a flip-flop history was for.

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
