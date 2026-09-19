---
$schema: folio-todo/v1
id: what-kick-off-means-for-a-ci-watcher
summary: "Decide what 'kick off' means mechanically for the two CI-watcher dispatch points"
status: open
priority: medium
origin: agent
createdAt: 2026-09-19
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

## What is already true, so this is not started from nothing

The two dispatch points are process events, so wherever they are performed they
should be DRAWN in BPMN under `skills/workflows/`. The likely homes are
`draft-to-publication` for the merge-to-main gate and a feature-branch process
that may not exist yet — that needs checking rather than assuming.

## If nothing is decided

Nothing fires. `bun run check:ci-health` still runs in the session-start sweep
and `ci-health.yml` still runs weekly, so the watcher is not silent — it is
just not tied to the two moments named above.
