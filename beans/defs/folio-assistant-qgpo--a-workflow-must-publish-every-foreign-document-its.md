---
# folio-assistant-qgpo
title: A workflow must publish every foreign document its own graph links into
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T18:27:04Z
updated_at: 2026-09-21T19:22:32Z
parent: folio-assistant-vke6
---

Found while closing `3jhq`, and deliberately not attempted there.

## The gap, stated precisely

`check:published-instance-exports` (from `u1iu`/#725, widened in `3jhq`) checks
that every `kg-export --instance` invocation a workflow runs **succeeds**. It
does not check that a workflow publishes everything its own graph **links
into**.

So the defect `3jhq` was opened for would not be caught by the fix `3jhq`
shipped: `feature-staging.yml` published no site-root export at all, and
deleting that invocation again leaves the gate green — one fewer invocation is
not a failing one.

## The invariant

> A workflow that publishes this instance's graph must also publish every
> foreign document that graph links into, at the path the link names.

Both halves are already computable:

- the link targets: build the export at that workflow's base and read the
  foreign `@id`s out of it — `3jhq` did exactly this by hand, and got
  `$BASE/cat-bootstrap.jsonld#skill/discussion`
- the paths written: the `--out` arguments in that workflow's own `run:` steps,
  the same source `check:workflow-script-paths` (`tyyc`/#721) already parses

## Why it is worth doing rather than filing and forgetting

This is the `blv9` class, and it has now been found **three** times by hand:
`blv9` itself, `3jhq` on the staging workflow, and the two dangling links
`3jhq` measured. Each time a person noticed; no check did.

## Done when

- [ ] the link targets a workflow's export would mint are derived, not listed
- [ ] each is matched against the paths that workflow writes
- [ ] a target nothing writes is a finding that NAMES the workflow and the link
- [ ] could-not-determine is a third state — an export that will not build is
      not "no dangling links"
- [ ] falsified by deleting a publish step and watching it go red
