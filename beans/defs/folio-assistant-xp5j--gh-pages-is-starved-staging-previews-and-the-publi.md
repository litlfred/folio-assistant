---
# folio-assistant-xp5j
title: 'gh-pages is STARVED: staging previews and the published site contend for one serialised Pages deployment, 72 of 100 cancelled'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T06:49:11Z
updated_at: 2026-10-04T08:00:34Z
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

## Done when
- [ ] owner picks an option
- [ ] a successful deployment lands within one burst of a push to `gh-pages`
- [ ] `check:ci-health`'s newest-settled line reads success rather than cancelled

_2026-10-04T08:00:34Z_ — Claimed by claude/xp5j-ref-steward — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
