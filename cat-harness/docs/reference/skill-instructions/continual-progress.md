---
layout: default
title: /continual-progress
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/continual-progress.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/continual-progress.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/continual-progress.md){: .fa-edit-source }

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
   accumulate work on a local branch with no PR. **Never ask permission to
   open one** — branch, commit, push and PR are all pre-authorised.

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

## The fifth invariant, and the one agents get wrong

5. **Do not hold a green change proposal back waiting for someone to look at
   it.** This is the rule that gets inverted in the name of care, and inverting
   it is not caution — it is a blocked reviewer.

An agent that has just built something it cannot fully verify — a rendered page,
a diagram, a UI — reaches for the responsible-sounding move: leave it open,
attach a preview, ask the human to confirm first. That feels safer. It is worse,
for a reason worth internalising:

> **A human cannot assess a rendered artefact from a description of it, and a
> preview pasted into chat is a strictly worse proxy than the deployed thing.**

Holding the merge does not transfer the verification to them — it *withholds the
only form in which they could do it*, and asks them to adjudicate from a
screenshot.

Measured, 2026-09-16. A documentation change with five generated diagrams was
green, unreviewed and unmerged, held back with three SVGs attached in chat and a
note that the layout was machine-accepted but not confirmed legible. The
author's reply was *"jsut merge so i can help assess"*. The hold made assessment
harder, not safer, and cost a round-trip to someone who types with difficulty.

### What to do with the thing you could not verify

**Say it in the body, and merge anyway.** `## Not verified` is a real section
and an honest one; an unmerged proposal is not a substitute for it.
Reversibility is what makes this safe — a docs or content change is one revert
away, and the cost of reverting is far below the cost of a human blocked on a
decision they have no artefact for.

### A pipe discards the exit code — so a piped run cannot verify anything

**`cmd | tail` makes `$?` the status of `tail`.** Every claim that a command
PASSED must come from a run without a pipe, or from `${PIPESTATUS[0]}`.

This is mechanical rather than a matter of care, and it is written down because
care did not prevent it. Twice in one session, 2026-09-20:

- `gen-site-jsonld --check` on a genuinely stale tree. `… | tail -8; echo $?`
  printed **0**. Caught within the minute — and the commit message that fixed
  it said "worth checking rather than assuming".
- `site:links` from the repository root, two hours later. Read the message,
  never checked `$?`, and **opened a bean** asserting a defect that does not
  exist: the script exits 2 and always has. Scrapped as `ipth`.

The second is the expensive shape. A command whose output *sounds* like a
failure, run through a pipe, reads as a silent pass — and a silent pass is
precisely what this repository treats as worse than a loud failure. The first
cost a minute; the second cost a bean, a wrong diagnosis, and very nearly a
"fix" to working code.

**So: when the question is "did this pass", run it bare.** When you want both
the output and the verdict, run it twice or capture the status first. Reading a
verdict off prose you piped is the same error as quoting a count from prose.

### The exceptions, and none of them is "I am unsure"

- **Never merge red.** A failing or unrun required check is a real blocker.
- **Never merge over an unresolved review thread** you have not answered.
- **Where the repository requires explicit merge permission, that wins**, and
  nothing here relaxes it by a word. Some folios require an explicit "merge it"
  from the author for *every* merge to the default branch. There the rule reads:
  get it green, get it mergeable, **say once that it is ready**, then stop — do
  not re-ask on a timer, and **do not let "not merged yet" become a reason to
  stop pushing.**

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
- **A folio's own `AGENTS.md`** may carry these rules for that repository, and
  a stricter merge gate — `litlfred/qou` §"Branch + PR workflow" is the worked
  case. This skill is the platform-side statement; where a folio is stricter,
  the folio wins.
- [`/todo-manager`](todo-manager.md) — the session work-plan; the
  PR-body status checklist (invariant 3) is its externally-visible
  projection, so a watcher needs no access to the session's bean queue.
{% endraw %}
