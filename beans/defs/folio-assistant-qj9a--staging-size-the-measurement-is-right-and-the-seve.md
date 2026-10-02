---
# folio-assistant-qj9a
title: 'STAGING SIZE: the measurement is right and the SEVERITY is an unverifiable claim — critical predicts a failed publish, and nothing in this repo can observe enforcement'
status: in-progress
type: bug
created_at: 2026-09-25T18:10:30Z
updated_at: 2026-09-25T18:10:30Z
parent: folio-assistant-1xhc
---


`health` reports `staging-preview-size` as **critical** while every deploy keeps
succeeding. I went looking for a wrong number and did not find one: **the
measurement is sound.** What is wrong is one level up, in what `critical` is
asserting.

## Measured first-hand, 2026-09-25

Directly off the publish ref — `git ls-tree -r -l origin/gh-pages`, not the
check's own report:

| | files | size |
|---|---|---|
| whole published tree | 50,511 | **2.67 GB** |
| `STAGING/` | 46,127 | 2.37 GB |
| the main site | 4,384 | 0.30 GB |

So the check is right about the quantity AND right that it is the published
tree: `docs-site.yml`'s own header states the serving model — *"published to the
gh-pages branch … Settings → Pages → 'Deploy from a branch' → gh-pages → /
(root)"*. `STAGING/` is inside what is served, so its bytes count. Both halves of
my leading hypothesis (that the limit was not about this tree, or that the
measurement counted a different quantity) are **refuted**.

**When it crossed**, from the committed health history rather than from memory:

    2026-09-19 … 2026-09-22    0.06 – 0.86 GB
    2026-09-23                 1.46 GB   ← crosses the documented 1 GB
    2026-09-24                 2.83, 2.84 GB
    2026-09-25                 2.93, 3.10 GB

Two and a half days above the limit, continuously.

## A second, smaller finding found by cross-checking the two numbers

My `git ls-tree` measurement and the check agree **exactly** on `STAGING/` —
2.37 GB — which is the cross-validation that makes the rest of this trustworthy.
But it shows what the threshold is compared against: **`STAGING/` alone**, not the
whole served tree.

That is coherent with the basis's reasoning (leave room for the main site) and
the arithmetic does not quite work:

    STAGING_CRITICAL_BYTES   750 MB   the slice previews may occupy
    the main site             300 MB   measured, 4,384 files
                            -------
                            1050 MB   against a documented 1 GB ceiling

So `critical` fires 50 MB *after* the combined total would already have crossed
the limit it is derived from. Tiny next to a 2.37 GB overshoot, and not what this
bean is about — recorded because it was found while checking the numbers agreed,
and because the main site's 0.30 GB is itself a measurement nobody had put beside
the threshold.

## The defect: `critical` asserts something nothing here can observe

The threshold's `basis` for `STAGING_CRITICAL_BYTES` says:

> Three-quarters of GitHub's documented 1 GB Pages limit. Past here the previews
> occupy most of the budget the main site must also fit inside, and **the next
> deploy is the one that fails to publish** — so **something is about to be
> lost**, which is what `critical` means on this scale.

That is a claim about **GitHub's enforcement behaviour**. This repository has no
instrument for it, and I could not acquire one:

| what I tried | result |
|---|---|
| `GET https://litlfred.github.io/folio-assistant/` | `connect_rejected` — egress proxy, organization policy |
| the same for a `STAGING/<slug>/` page | `connect_rejected` |
| `GET /repos/:o/:r/pages` (source + status) | every field `None` |
| `GET /repos/:o/:r/pages/builds` | *"Access to this GitHub API path is not permitted through this proxy"* |
| `actions/workflows/pages-build-deployment/runs` | `total_count: None` |

**And the evidence I had been leaning on does not bear the weight.** I had said
"the site is publishing" because `docs-site.yml` runs #683–#690 are green. A
green run proves the **push to `gh-pages` succeeded**. Serving is GitHub's side
of the line, and a successful push tells you nothing about whether Pages then
built, truncated, or refused. Two days of green deploys therefore neither
confirm nor refute the basis — which is exactly the point.

So the finding is not "the check is wrong". It is:

> **`critical` is a determined-sounding verdict over a question the check has no
> instrument for.** The repository's own rule is that could-not-determine must
> never be rendered as a determined answer; here the violation is in a
> threshold's SEVERITY rather than in a check's output, which is why no existing
> guard catches it.

## Why this is not `tebu` again

`tebu` (completed) took the same finding at 878.7 MiB and acted on **preview
size** — measured 88.3 → 39.2 MiB per preview by omitting `reference/` and `api/`
unless a branch touches their sources. That was the right lever and it worked.
It did not touch the severity semantics, and the number has since grown 3×
anyway, which suggests per-preview size alone does not hold the line at this
concurrency.

## The instrument that is missing is already a known gap

`7s52` — *"staging-review hands a reader URLs the AGENT cannot open"* — is the
same wall, hit from the other side, and it is `in-progress` and quiet.

**But it does NOT supply the instrument this bean wants, and I had that wrong.**
I first wrote here that "whatever answers those answers this". Reading `7s52`'s
own `## Done when` refutes it — one item is:

> The limit is stated: it serves BYTES, not the live host — redirects, headers
> and Pages' own 404 behaviour are out of scope.

So `7s52` works AROUND the unreachable host by reading bytes off the publish ref,
and explicitly declines to observe serving. That is the right call for its
purpose (a reader wants the content) and the wrong one for this (a check wants to
know whether GitHub accepted it). **The instrument is a separate need, not a
by-product of `7s52`**, and saying otherwise would have left the gap looking
owned when it is not.

`1lfx` (*"DEPLOY: STAGING must report which host…"*) is adjacent and `todo`.

Nothing in `7s52` is edited from here: it is a sibling's claim, quiet but theirs.

## Options — not a decision

1. **Re-word the severity's basis to what it can support.** `critical` becomes
   "past a documented limit; enforcement not observed from here", and the action
   names the person who can look. Cheapest, honest, and changes no behaviour.
2. **Build the instrument** — a probe that fetches the published site and records
   HTTP status and served size, so a claim about publishing has evidence. Blocked
   from this container by egress policy, so it has to run in CI, not locally.
   That is `7s52`'s territory and should be settled there rather than twice.
3. **Split the check in two**: `staging-preview-size` measures and stays
   `major` at most; a separate `pages-publish-health` owns the serving claim and
   reports `unknown` until an instrument exists. Cleanest against the
   content/context/state discipline, largest change.

1 is worth doing whichever of 2 or 3 happens, and does not preclude either.

## What I am NOT doing

Not removing a preview. Every remedy this check names is a person's
(`deletion-requires-confirmation`), the owner set 500 MB deliberately on
2026-09-20, and nothing here establishes that the store needs draining — only
that the reason given for draining it is unverified.

## Done when

- [x] `STAGING_CRITICAL_BYTES`' basis claims only what an instrument can support —
      superseded by the SPLIT: the threshold is gone from `staging-preview-size`
      entirely, and its argument moved to `pages-publish-health`
- [x] The finding's action names who can observe the served site, since no agent
      here can
- [x] It is recorded that a green `docs-site.yml` run is evidence about the PUSH
      and not about serving — in `pages-publish-health`'s own docs, so it sits
      beside the check that would otherwise re-make the mistake
- [x] The instrument's owner is settled — it is NOT `7s52`, which declines the
      live host by design. It got its own bean: `1dre`, the CI-side serving probe


## The split landed, and building it corrected the plan again

Option 3 was chosen and implemented. Two things the implementation established
that the options above had wrong:

**1. A check reporting `unknown` would have broken the health family.** The
option read *"a separate `pages-publish-health` owns the serving claim and
reports `unknown` until an instrument exists"*. Reading `healthVerdict` refutes
it: a single `unknown` takes the ENTIRE report to `unknown`, `run.ts` exits 2 and
the tracking issue is left untouched. `health-check.yml`'s own comment already
said what that is worth — *"the whole verdict goes to `unknown` — correctly, and
uselessly"*. A permanently blind check would have made the daily sweep
permanently useless and hidden every other check behind it.

So the new check's subject is narrowed to something **determinable**: *does an
instrument exist?* Answerable today (no), so it reports a `major` finding and
never `unknown` about its own subject. Measured after the change: `bun run
health` exits **1 (findings)**, not 2.

**2. The critical threshold did not need re-wording, it needed removing.** `qj9a`
first re-worded its basis. The split shows that was treating a symptom: the
threshold's entire justification was the publish consequence, so once that moved,
nothing was left for the number to mean in this check. `staging-preview-size` now
carries one threshold — the owner's 500 MB budget — and **never escalates past
`major`**, pinned by a test at an absurd 3.7 GB rather than just past the line.

Two stale statements fixed in passing, both the same defect the code comments
warn about: the registry summary still advertised *"owner's 100 MB warning"* after
the raise to 500 MB, and the check's own summary still claimed the previews had
*"grown past what a GitHub Pages site can carry"* — a publish claim, in the check
that just had one taken away.
