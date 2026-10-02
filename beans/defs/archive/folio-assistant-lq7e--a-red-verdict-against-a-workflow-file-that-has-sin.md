---
# folio-assistant-lq7e
title: A red verdict against a workflow file that has since changed is reported as a live fire
status: completed
type: task
priority: normal
created_at: 2026-08-26T17:45:00Z
updated_at: 2026-08-26T17:48:40Z
---

Claimed on claude/publication-workflow-diagrams-4uw90m (PR #139).

## The diagnosis that produced this

Item 2 of the session: are `witness-refresh.yml` and `qa-sweep.yml` — both red
on `main` since 2026-08-07T15:04 — actually broken?

**They are fixed, and confirming it cost no Actions minutes.** The evidence:

- All four failing runs (two per workflow, within 2s of each other) were
  `push` events on `main`, named by PATH rather than by `name:`. Both files
  declare `on: workflow_dispatch` only. A dispatch-only workflow cannot fire
  on push — unless GitHub could not parse the file and so never read the
  `on:` block. That is the startup-failure signature.
- `witness-refresh.yml` carries the post-mortem in its own comments: a commit
  message block scalar whose body reached column 0, ending the scalar so YAML
  read the prose as a mapping key.
- Both files were last changed in c1f3415 (2026-08-08T18:57), the day after.
- **75 pushes to `main` since that commit produced ZERO runs of either
  workflow.** A parseable dispatch-only workflow does not fire on push. Absence
  of runs is the proof of the fix.
- Both parse under `yaml.safe_load` locally, `on: [workflow_dispatch]`.

## The defect this bean is for

Neither will ever go green. They only run on dispatch; the report only reads
`main`; so their last verdict on `main` is a failure from a version of the file
that no longer exists, and it will sit red forever.

Worse, dispatching them cannot clear it either: both fail BY DESIGN in this
repo. `qa-sweep` preflights on `content/package.json` and exits 1 ('the
platform carries no folio'); `witness-refresh` cd's into
`folio-assistant/computations`, which does not exist here.

So the report ships with two permanent false fires — which erodes exactly the
attention it exists to protect. That is xom7's own failure mode one level up,
and it is in code that has not merged yet.

## Fix

Same family as the `workflowExists` predicate already there (a DELETED
workflow's runs are history, not a live problem). Add the sibling rule: a red
whose newest run PREDATES the last change to its workflow file is a verdict
about a version that is gone. Report it as `superseded` — its own state, ranked
below red, never rendered as green, and not counted as a live failure by the
exit code. The file's change date comes from `git log -1 --format=%cI`, which is
local, free, and exact — evidence rather than the age heuristic it replaces.



## Done

`assess()` gained `workflowChangedAt`, wired in `check-ci-health.ts` to
`git log -1 --format=%cI origin/<branch> -- <path>` (local, free, exact). A red
whose newest run predates that date becomes `superseded`: its own Health state,
sorted below red, rendered '❔ … stale, not green', and not counted by the exit
code as a live failure.

Eight tests pin it, and four pin the ways it must NOT fire: no predicate, git
answering undefined (shallow clone), a run with no path, and a GREEN workflow
whose file changed. The rule may only ever DEMOTE a red — a later edit is
evidence the failing version is gone, never evidence the new one works.

Also fixed the render's 'every workflow with a recent run is green' line, which
would have been a lie with a superseded entry present.

Live: both workflows now read ❔ instead of ❌; `check:ci-health` exits 0.
