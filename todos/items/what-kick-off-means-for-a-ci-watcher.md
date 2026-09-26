---
$schema: folio-todo/v1
id: what-kick-off-means-for-a-ci-watcher
summary: "Decide what 'kick off' means mechanically for the two CI-watcher dispatch points"
status: in_progress
priority: medium
origin: agent
# THEME, chosen by judgement from this todo's content (bean `5y4b`).
# CI dispatch mechanics — `operations` is the theme for building the thing and running it, and a watcher's kick-off is exactly the running half.
theme: operations
createdAt: 2026-09-19
targetLabel: sec:publication-workflow-agents-and-system-actors
processes:
  - Process_CodeReview
  - Process_Publication
identities:
  - github:litlfred
references:
  - kind: bean
    id: folio-assistant-29ij
---
Stated 2026-09-19: a CI watcher *"should kick off during feature development
once changes are made to feature branch. and when approved for final
publication/merge to main."*

The two dispatch points are clear. **What performs the dispatch is not**, and
the three candidates differ enough that guessing would be wasted work.

## ANSWERED, 2026-09-19

Owner: *"kick off if like task or workflow initation or bean roast"*.

**Option 2.** A dispatch point is a **task / workflow initiation**, and it
opens a **bean** — not a GitHub Actions job. That is the answer the repo's own
machinery is already shaped for: an activity carrying
`<folio:bean op="claim"/>` performs the bean operation when the step
completes, so "start the watcher" and "record that it is running" are one
declared step rather than two mechanisms that can disagree.

It also settles the cost I flagged against option 2 — that a BPMN activity
only fires while somebody is working. With a bean opened at initiation, the
work is *durable*: a later session sees the bean whether or not the session
that opened it is still alive.

Remaining, and now narrow: which diagrams host the two steps, and whether the
feature-branch one needs a process that does not yet exist.

## Options, with what each costs

1. **A GitHub Actions job.** Fires without anybody present, which is the whole
   premise of `xom7` — the failure being guarded against is a quiet stretch
   with nobody looking. Cost: it cannot read the session's memory, so the
   "dispatch an agent with a specific memory context" half does not happen.
2. **An activity in a BPMN process**, performed by a session. Gets the memory
   context, and puts the dispatch where `workflow_next` can report it. Cost: it
   only fires while somebody is working — precisely the stretch that is already
   covered.
3. **An MCP tool a workflow step calls.** Both, at the price of building the
   tool and deciding who calls it.

## Where the two dispatch points already live

Both are steps in diagrams that exist, which is why this todo is tagged with
them rather than describing them:

- **"approved for final publication / merge to `main`"** is
  `Process_Publication` (`draft-to-publication.bpmn`), whose lane carries
  *Authorise the release* and *Version, tag and publish*. The dispatch point
  the owner named is that authorisation step.
- **"once changes are made to feature branch"** is `Process_CodeReview`,
  reached from `Process_Review`.

## What is already true, so this is not started from nothing

The two dispatch points are process events, so wherever they are performed they
should be DRAWN in BPMN under `processes/`. The likely homes are
`draft-to-publication` for the merge-to-main gate and a feature-branch process
that may not exist yet — that needs checking rather than assuming.

## If nothing is decided

Nothing fires. `bun run check:ci-health` still runs in the session-start sweep
and `ci-health.yml` still runs weekly, so the watcher is not silent — it is
just not tied to the two moments named above.
