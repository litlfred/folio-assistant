---
# folio-assistant-xp5j
title: 'gh-pages is STARVED: staging previews and the published site contend for one serialised Pages deployment, 72 of 100 cancelled'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T06:49:11Z
updated_at: 2026-10-04T08:02:37Z
parent: folio-assistant-1xhc
---

## How this surfaced

`bun run check:ci-health` on `main`, 2026-10-04. The Pages half of that report
exists precisely because a Pages build outcome is a fact GitHub holds *about*
this repository rather than one the repository holds, so it is asked fresh and
cached nowhere. It said:

    - ✓ 27 succeeded
    - ❔ 72 cancelled — neither shipped nor broken
    - ✗ 0 failed
    The newest deployment to settle did NOT succeed (cancelled, 06:43:08Z),
    and the site is as of 06:34:52Z.

and, importantly, ruled out the easy explanation itself: *"No deployment
superseded its own slug in the window — whatever cancelled these builds, it was
not one workflow pushing twice (`bm6d`)."*

## Measured

From `actions/runs?branch=gh-pages`, 100 runs spanning 14.0 h:

    7.1 deployments/hour
    27 success · 72 cancelled · 0 failed
    gap between SUCCESSFUL deployments: median 9.6 min, **max 396.2 min**
    longest consecutive cancellation streak: **24**

**396 minutes is 6.6 hours with nothing reaching the published site.** That is
the number that makes this a defect rather than ordinary coalescing: a
superseded preview leaving the previous one in place is harmless, but a
published site six hours behind `main` is a site nobody can trust to read.

Every one of the 100 runs is the SAME workflow — GitHub's built-in
`pages build and deployment`. There is no second deployer to blame.

## The mechanism

Recent `gh-pages` commits, 20 in ~41 minutes:

    18 × staging(<branch>)      previews, from ~15 DIFFERENT branches
     2 × docs(gh-pages): site   main's published site

Each push triggers the built-in Pages deployment, whose concurrency group
cancels the build in flight. The pushes arrive in bursts — 06:21:30, 06:21:57,
06:22:16 is three in 46 seconds — so a burst cancels everything before its last
member, and the next burst can cancel that one too.

So **`main`'s published site competes with every open branch's staging preview
for one serialised deployment slot, and loses.** With ~40 open PRs the
contention is structural, not incidental: it gets worse as the repo gets busier,
which is the opposite of what a publishing path should do.

This is the `bm6d` question asked one level out. `bm6d` was one workflow pushing
twice and superseding itself; here it is MANY producers sharing one consumer,
and the report already distinguishes them.

## Options — the owner's call, because this is publishing configuration

1. **Point Pages at a custom workflow with `concurrency: { group: pages,
   cancel-in-progress: false }`**, so deployments QUEUE instead of cancelling.
   This is the standard remedy and the only one that keeps both previews and the
   site. Cost: deployments serialise, so a burst takes longer to drain, and the
   built-in deployer is replaced by `actions/deploy-pages`.
2. **Debounce the staging pushes** — coalesce per branch, or push previews on a
   timer rather than per commit. Keeps the built-in deployer; reduces preview
   freshness.
3. **Move staging previews off `gh-pages`** to a separate host or ref, leaving
   `gh-pages` for the published site alone. Largest change; cleanest separation.
4. **Accept it**, recording that previews are best-effort and the published site
   may lag by hours. Honest, and costs nothing — but it makes
   `check:ci-health`'s Pages section permanently amber, which trains readers to
   ignore it.

Option 1 is the recommendation. **Default if nobody picks: nothing changes**, the
site keeps lagging, and this bean stays open as the record of why.

## Not done here, deliberately

Nothing was reconfigured. Pages settings decide what the world sees of this
repository, and `check:ci-health` reports the share of cancellations WITHOUT
grading it (bean `3yi4`) for the same reason: the number is a fact, the
threshold is a judgement.

## Owner's ruling, 2026-10-04 — option 1, then RECAST

The owner picked option 1 (queue instead of cancel), then redirected: *"dont
rely on github actions. use merge manager skills/extend/genrelzie/recast?"* and
*"extend merge manager role per watched branch? gh-pages, then the incoming
cat/cat-harness/* branches?"*, and chose **role recast AND gh-pages migration
together**.

That redirect is right, and the reason is measured in this repository already.

### Why option 1 as worded cannot work

`feature-staging.yml` carries the measurement, 2026-09-19:

> `cancel-in-progress: false` governs the RUNNING job, not the pending one.
> GitHub cancels a PENDING job when a newer one queues for the same group. So a
> third arrival silently drops the second.

Three staging runs from three different branches inside 17 seconds: two
cancelled, one ran. **A GitHub concurrency group does not queue.** It keeps at
most one pending run. So `concurrency: { group: pages, cancel-in-progress:
false }` protects a RUNNING deployment and still drops intermediate pending
ones — a partial fix dressed as a complete one.

It is still an improvement, because the 24-cancellation streak was builds killed
IN FLIGHT. It is not the fix.

## Move 1 — the class (`generalise-the-fix`)

**The defect, not the symptom.** The symptom is 72/100 cancelled. The defect is
that **`merge-steward` is declared over an implicit single ref.** Its
description — *"composes a merge train from the queue … landing waits for the
owner's release"* — never names WHICH ref, so a second contended ref cannot
acquire a steward. The abandoned fix shows the skill's own tell: `group: pages`
**names one instance**, and would have left all six `cat/cat-harness/*` refs
exactly as broken.

**The sweep, with its denominator.**

    workflow files parsed                    35 of 35
    workflows that write any ref             10 of 35
    workflows that really push gh-pages       5
       discoverability-docs, docs-site, feature-staging, folio-staging, publish
    workflows using branch-store's route API  0
    remote branches                         809
    shared-store refs, many producers         7   gh-pages + 6 cat/cat-harness/*
       ...of those, with a steward            1   main

Two corrections to this bean's own §"The mechanism", which inferred producers
from commit-message prefixes and named **2**:

- there are **5**, found by parsing the workflows;
- a first pass said 6. `merge-main.yml` has **0** write-markers — a crude
  `'gh-pages' in text` matched a comment. The refined count is 5.

**Right layer.** Workflow concurrency → the contended ref → **the role that owns
writes to a ref.** Stop there. And the design is already in the tree:
`scripts/branch-store.ts` declares `keyedBy: "route"` for exactly this case —
*"nobody authored either side, so the newer generation wins and a `conflict`
would block a push over content no one disagrees about"* (bean `1j3q`).
`gh-pages` IS a route-keyed store that was never migrated: `STAGING/<slug>/` per
branch, `/` for the site, one owning generator each.

## Move 2 — the adversary

**What does this now apply to that the defect did not?** A per-ref steward
would reach all 809 refs, including the 802 with one producer, where it is pure
overhead AND a new single point of failure. Narrowed on both axes: SCOPE — only
refs declared in `scripts/special-branches.json`; STATE — only while a ref has
more than one writer.

**The case that must still fire:** a same-route double write where somebody DID
author both sides must not be lost to "newer wins". On `gh-pages` it cannot
happen today — `/` is written only by `docs-site`, `STAGING/<slug>/` only by the
owning branch — but that is the test the migration owes, not a reason to skip it.

**The adversary reverses the fix.** Route-keying removes CONFLICTS; it does not
remove BURSTS. GitHub still deploys per push and still cancels in flight, so
fewer pushes is a smaller burst, not no burst. **So the migration fixes the
defect and does NOT on its own close this bean's symptom** — that needs the
steward to COALESCE pushes into one per window, which a coordinator can do and a
concurrency policy structurally cannot. That is where the role earns its place
rather than merely being tidier.

## Two gaps found in the declaration itself

`scripts/special-branches.json` is *"the ONE declaration of the names"* and says:
*"INTERIM: bean `rva2` (arc fs43 P7) plans to declare every special branch with
the `storage` field arc 3fva introduces on ContentDirectory. When that field is
on main, this table folds into it."* That field IS on main —
`keyedBy: z.enum(["commit","tip","route"])` in `schemas/cat-harness.ts`. So:

1. **`gh-pages` is the only entry stating no keying**, while `beans`, `todos` and
   `fsh-guts` each say `keyedBy: tip`. It is route-keyed and nothing says so.
2. **Its `writers` list holds 4; the sweep found 5.** `publish.yml` defaults
   `publish_branch: gh-pages` and is unlisted. A declared-writers list that is
   quietly incomplete is the `audit-coverage` shape: nothing compares the
   declaration against the workflows that actually write the ref.

Gap 2's fix is not "add `publish.yml`" — that is the symptom again. It is a gate
that checks the declared `writers` against the measured ones, which is what
would have caught it.

## Done when
- [x] owner picks an option
- [ ] `gh-pages` declares `keyedBy: "route"` in `scripts/special-branches.json`
- [ ] a gate compares each special branch's declared `writers` with the measured
      writers, and fails on a disagreement in either direction
- [ ] `merge-steward` is recast to steward a NAMED watched ref, with the ref
      named by the lane instance rather than by the role
- [ ] the 5 gh-pages producers write through `branch-store`'s route keying
- [ ] a test covers the same-route double write that must still be reported
- [ ] a successful deployment lands within one burst of a push to `gh-pages`
- [ ] `check:ci-health`'s newest-settled line reads success rather than cancelled
