---
# folio-assistant-ceud
title: 'CI: a push to a PR branch fired NO workflow at all — a PR that looks untested rather than red'
status: todo
type: bug
created_at: 2026-09-24T17:30:00Z
updated_at: 2026-09-24T17:30:00Z
parent: folio-assistant-1swy
---

Measured 2026-09-24, working PR #1241.

`6603c3fbc4d` was pushed to `claude/cool-fermi-htir5p`, an open PR branch.
**No workflow fired for it at all** — not `code-quality-gates`, not
`jsonld-gen-check`, not `feature-staging`. The latest run of every workflow
stayed on the previous SHA, `f1fb1556576`, for 35 minutes.

## What was ruled out

- **The push landed.** `git ls-remote origin claude/cool-fermi-htir5p` returned
  `6603c3fbc4d…`, so the ref was on the remote.
- **No path filter.** `code-quality-gates.yml`'s `on:` block is
  `pull_request: / merge_group: / push: branches: [main] / workflow_dispatch:` —
  bare `pull_request`, no `paths`, no `types`, so the default
  `opened|synchronize|reopened` covers a push to the head branch.
- **No queue backlog.** Runs on this branch were completing in ~4 minutes
  throughout, before and after.

A hand `workflow_dispatch` ran and went green, so nothing about the tree was
wrong.

## Why this matters more than a flake

`1xhc` at the workflow level: **a gate that does not fire is indistinguishable
from one that passed.** But this is the worse half of that — a red PR announces
itself, whereas a PR with no runs at all looks *untested*, and the GitHub UI
shows the previous commit's green checks beside the new head. An agent or a
person reading "checks passed" is reading a verdict about a different commit.

I noticed only because I was tracking the SHA by hand.

## Done when

Either a second occurrence is caught with enough evidence to name the cause, or
somebody establishes this was a one-off GitHub delivery failure and says so
here. **One occurrence is not a pattern** — this bean exists so the second one
is not diagnosed from scratch.

Not actionable in code today. The delivery logs that would settle it
(Settings → Webhooks → Recent Deliveries) are not readable from a session.
