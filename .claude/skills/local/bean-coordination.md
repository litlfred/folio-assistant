# Bean Coordination — multi-agent work-plan discipline

Canonical, repo-agnostic coordination skill for agents sharing a `beans`
work-plan (see `.claude/skills/local/todo-manager.md` for what beans are and the
core commands). This is the **generic source of truth**; downstream repos (e.g.
qou) vendor or sync it rather than hand-maintaining their own copy.

The problem this solves: several agent sessions run in parallel against the same
repo, each in its own `claude/*` branch and ephemeral container. Without
discipline they duplicate work, clobber each other's queues, or resolve items a
sibling is mid-flight on. Beans are durable (committed) and therefore the shared
substrate for coordinating across sessions.

## Lifecycle of a coordinated work item

1. **Prime** — at session start, read the current work-plan
   (`beans prime` + `beans list`, or the CLI-independent fallback that parses
   `.beans/` directly). Know what is open and what siblings are touching.
2. **Declare intent + claim** — before starting work, set the bean
   `in-progress`. The claim is durable and visible to siblings, so two sessions
   don't pick the same probe. Add a short note naming your branch.
3. **Work** — keep the bean current; append status notes as you progress. Do not
   fork the bean into a parallel `todos/*.json` queue — link to any bulk queue
   from the bean instead.
4. **Hand off or finish** — on landing, close the bean and update any cross-repo
   ownership note. If you stop mid-flight, leave the bean `in-progress` with a
   note on where you got to, so the next session can resume.

## Rules

- **Claim before you work.** An unclaimed bean is fair game for any session;
  a claimed one is not. Respect sibling claims.
- **Agents create and `in-progress`; they do not resolve others' items.** Only
  close a bean you own or were handed. Never delete a sibling's bean.
- **`beans ≠ sidecars`.** Never `beans create` a QA (`*.qa.json`) or witness
  (`*.witness.json`) queue, or any bulk machine-generated queue. Those stay as
  bulk JSON read by their own tooling.
- **Move wiring and script together.** When relocating a hook-backed script or a
  queue, repoint every reference (docs, hooks, code readers) in the same change.
  A reference without its backing file — or a file no reference points at — is
  the migration failure mode to avoid.
- **One source of truth per concern.** If a goal has a bulk queue, the bean is
  the index and the queue is the data; don't duplicate state across both.

## Session-start coordination sweep

A session-start surface should, without disrupting the user-facing flow:
- fetch the default branch and note how far it has moved since this branch
  diverged;
- summarize recent sibling `claude/*` branch activity;
- surface the current bean work-plan (`beans prime`), with a CLI-independent
  fallback for fresh containers that boot without the CLI on `PATH`.

Heavy triage (reading every new commit, every sibling PR) belongs in a
background subagent, not the foreground. Escalate to the user only when the
sweep surfaces something actionable against the current work-plan.

## Cross-repo ownership

When this skill or the installer changes, the generic version here is canonical;
downstream repos sync from it. On landing a coordination change that affects a
downstream repo, update that repo's ownership note and close the tracking beans.
