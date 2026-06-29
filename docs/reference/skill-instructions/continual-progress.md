---
layout: default
title: /continual-progress
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/continual-progress.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/continual-progress.md) — do not edit here.

{% raw %}
# /continual-progress — trackable, always-PR'd, continually-committed work

Sibling agents and the author can only coordinate with work they can
*see*. This skill makes every in-flight task **trackable in real time**:
the PR is open from the first commit, progress lands as a stream of
small pushed commits, and the PR body carries a live status checklist.
It is the visibility complement to [`/coordinate`](coordinate.md) (which
triages *across* PRs); this one governs how *your own* PR stays legible
while you work.

## The four invariants

1. **Always have an open PR (from commit #1).** Branch, make the first
   (even stub) commit, push, open the PR — *before* further work. The PR
   is the durable, visible artifact; the chat session is ephemeral. Never
   accumulate work on a local branch with no PR. (Operationalises
   AGENTS.md "Branch + PR workflow" rule 2.)

2. **Commit + push small, coherent increments — continuously.** Each
   logically distinct change is its own commit (a single fix, a single
   module, a single unit of work). Push after each commit (or every 2–3 if
   moving fast). A watcher should be able to `git log` your branch and
   see a legible, bisectable trail — not one giant drop. Target: no more
   than ~20–30 min of work between pushes on a long task.

3. **Keep a live status checklist in the PR body.** Maintain a
   `- [ ] / - [x]` checklist of the task's sub-parts in the PR
   description (or a pinned top comment), updated as each increment
   lands. A sibling or the author should be able to read the PR body and
   know exactly what is **done / in-flight / remaining** — without
   reading the diff or asking in chat.

4. **Post brief intent — on your PR and overlapping siblings.** One short
   intent line on PR-open ("doing X on `<files>`; will touch `<scope>`");
   a one-line comment on any sibling whose scope overlaps ("starting
   `<theme>` on `<files>`; flag conflicts"). Don't *stream* comments —
   update the checklist (invariant 3) for routine progress; comment only
   for genuine coordination (overlap, a blocker, a handoff-relevant
   finding). Defer to [`/coordinate`](coordinate.md) for the full
   cross-PR triage protocol.

## Why — the failure modes this prevents

- **Stepped-on work.** A branch that hoards uncommitted work collides
  with siblings the moment it lands. Continual push surfaces intent from
  minute 1 so siblings triage *around* it.
- **Lost work on session reclaim.** Cloud sessions are ephemeral; an
  uncommitted change vanishes when the container is reclaimed. Push it.
- **Opaque progress.** "What's the status?" should be answerable from the
  PR body, not a chat scrollback. The checklist is the source of truth.
- **Un-takeoverable tasks.** If you go idle/blocked, a sibling can pick up
  a continually-committed, checklist-annotated PR; they cannot pick up an
  opaque local branch.

## Checklist (run this as you work)

- [ ] PR open? If not: branch → stub commit → push → open it **now**.
- [ ] Anything uncommitted older than ~20–30 min? Commit + push it.
- [ ] Does the PR-body status checklist reflect the current state?
- [ ] Any sibling whose files I just started touching un-notified? One
      intent line (not a stream).
- [ ] Blocked or going idle? Update the checklist + a one-line
      "blocked on X / handoff-ready" note so a sibling can continue.

## Relationship to other skills

- [`/coordinate`](coordinate.md) — cross-PR triage (scope map, sibling
  intent, cherry-picks, ledger). `continual-progress` keeps *your* PR
  legible so `/coordinate` (yours or a sibling's) has something to triage.
- **AGENTS.md "Branch + PR workflow"** — this skill operationalises rules
  2–6 (always-PR, microcommit, push-often) as a runnable checklist.
- [`/todo-manager`](todo-manager.md) — the session work-plan; the
  PR-body status checklist (invariant 3) is its externally-visible
  projection, so a watcher needs no access to the session's bean queue.
{% endraw %}
