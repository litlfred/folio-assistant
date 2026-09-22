---
# folio-assistant-tebu
title: Staging previews are at 878.7 MiB of a 1 GB Pages limit, nothing is prunable, and the check's remedy addresses a different budget
status: completed
type: bug
priority: high
created_at: 2026-09-22T06:03:07Z
updated_at: 2026-09-22T06:30:20Z
parent: folio-assistant-1xhc
---

`health` reports `staging-preview-size` **critical**: 10 previews, **878.7 MiB**,
past three-quarters of GitHub's 1 GB Pages limit, which the main site shares.

## Pruning cannot fix it, and the check's own action says to prune

Every one of the ten belongs to an **open and active** pull request — oldest
idle 12.9 h, six touched within six minutes of measuring. So the finding's
action —

> Ask which previews are still under review, then have the owner add
> `staging:cleanup` … Do not remove any preview without that label.

— has **no candidates**. The floor is 10 concurrent reviews x ~88 MiB, and the
**eleventh breaches the cap**. The threshold's own basis says as much:
*"the action this finding names is therefore never 'prune more' but preview
SIZE"*.

## Where the bytes are — measured, not assumed

One preview: 3,758 files, 88.3 MiB. HTML is **61.7 %** of it.

| | pages | MiB | per page |
|---|---|---|---|
| **`reference/`** | 257 | **35.8** | **143 KiB** |
| `api/` (TypeDoc) | 298 | 7.4 | 26 KiB |
| everything else | 121 | 11.2 | 95 KiB |
| **all HTML** | **676** | **54.5** | 82 KiB |

`reference/` is the outlier: **38 % of the pages, 66 % of the HTML bytes.** Its
source is 2.7 MB and 257 files in the repo, so the inflation is per-page theme
boilerplate — just-the-docs inlines the whole navigation into every page, and
`reference/` has the most pages carrying the least content each.

## Two defects in the check itself

1. **Its calibration is stale by more than 2x.** The basis reasons from *"the
   measured ~38 MB per preview"*; the measurement is **~88 MiB**. At that size
   the 500 MB warn level is about five concurrent reviews, not the thirteen it
   claims — so an ordinary working day now trips `critical`, and a threshold
   that always fires has stopped discriminating.
2. **Its named remedy addresses a different budget.** The basis blames blob
   sharing ("27.5 MB of each preview is HTML that shares ZERO blobs"), which
   governs *repository* growth. The limit it cites — 1 GB Pages — governs the
   **published tree**, where ten directories each carry their own copies.
   Measured: 878.7 MiB summed, 616.7 MiB unique, only 47.3 MiB shared at all.
   Dedup cannot move the number the threshold is about.

Prior work under `g196` optimised dedup across REBUILDS of one preview (the
constant banner fragment, TypeDoc's `--gitRevision <branch>`). That was the
right lever for repository growth and is not this.

## The tension any fix must respect

`reference/` and `api/` are exactly what a reviewer needs on a PR that changes
schemas or skills. Cutting them unconditionally would delete the thing under
review. So the cut has to be conditional on what the branch actually touches.

## Done when

- [x] A preview omits `reference/` and `api/` **unless the branch's diff
      touches their sources**, leaving a stub that links to the main site's copy
- [x] The saving is measured on a real preview, not projected
- [x] The check's stale ~38 MB calibration is corrected to the measured figure
- [x] The basis stops naming blob sharing as the remedy for a published-size
      threshold, or says explicitly which budget each sentence is about


---

## Summary of Changes (first half — the saving is NOT yet measured)

`feature-staging.yml` decides what the preview must carry before Jekyll runs,
and drops what this branch cannot have changed.

### Pruned at the SOURCE, not from `_site`

The obvious implementation — delete `_site/reference` before deploy — is
wrong, and the workflow's own navbar-tile check says why: just-the-docs builds
the nav from the pages present, so removing them afterwards leaves **all 676
pages linking into a tree that is not there**. That is the `udx8` defect the
check exists to catch, manufactured deliberately.

Removing them before the build means the nav never mentions them, the build is
faster, and **every remaining page shrinks too** — the nav boilerplate is what
makes `reference/` cost 143 KiB per page against 26 KiB for TypeDoc's.

### Conditional, and any doubt keeps them

`reference/` survives when the branch touches `cat-harness/schemas/`,
`skills/`, `methodologies/`, `docs/reference/` or the three generators;
`api/` when it touches `schemas/`. The PR's file list comes from the API
because this job checks out at depth 1, so there is no merge base to diff.

**No PR number, a failed call, or an unreadable list all carry everything.**
A preview that is too big is a threshold finding; a preview missing the pages
under review is a reviewer misled — and absence-read-as-evidence is the exact
family of bug this session has been unpicking all night.

### Verified by running it, not by reading it

The decision exercised against seven real change shapes:

| branch touches | reference | api |
|---|---|---|
| `schemas/types.ts` | yes | yes |
| a skill | yes | no |
| a reference generator | yes | no |
| regenerated `docs/reference/` output | yes | no |
| a methodology | yes | no |
| an unrelated guide | no | no |
| this branch (workflow + bean) | no | no |

The trim step itself was extracted from the parsed YAML and **run**: 257 files
to 1 stub, front matter at column 0 after the block-scalar dedent, tree
restored clean afterwards. That dedent is the failure the file's own comments
warn about, so it was checked rather than assumed.

`bun run gates` 100/100.

## What is NOT done

**The saving is projected, not measured**: ~43.2 MiB of 88.3 per preview, so
878.7 MiB should fall to roughly 450. That box stays open until a real preview
is measured after this lands, because the nav shrinkage means the true saving
is probably LARGER than the arithmetic and a projection is not a measurement.

The two defects in the check itself — the stale ~38 MB calibration and the
basis naming blob sharing as the remedy for a published-size threshold — are
also still open, and are edits to `test/health/` rather than to the workflow.


---

## MEASURED, on this branch's own preview — and it beat the projection

The staging build for PR #839 ran the changed workflow (a same-repo
`pull_request` uses the head's workflow file), so this branch became its own
test. Its diff touches `.github/workflows/` and `beans/` only, so neither
`reference/` nor `api/` was carried.

| | this branch (trim active) | a control preview |
|---|---|---|
| total | **39.2 MiB** | 88.3 MiB |
| files | 3,195 | 3,758 |
| HTML pages | **122** | 676 |
| mean per page | **68 KiB** | 83 KiB |
| `reference/` | 0.1 MiB (the stub) | 35.8 MiB |
| `api/` | 0.0 MiB | 7.6 MiB |

**49.1 MiB saved, 55.6 %** — against a projection of 43.2 MiB.

### The 5.9 MiB the arithmetic could not reach

Projecting 43.2 MiB assumed the saving was just the two directories. It is
not: **the mean page size fell 83 → 68 KiB**, on the 122 pages that remain.
That is the nav shrinkage — just-the-docs inlines the whole navigation into
every page, so removing 554 pages makes every surviving page smaller too.

This is why the third box demanded a measurement rather than accepting the
projection. The projection was not merely imprecise, it was **structurally
incomplete**: it could not see a second-order effect that turned out to be
14 % of the total saving.

### What it does NOT establish

The fleet total is **not** 9 x 39.2. The trim is conditional, and this
repository's branches frequently touch `skills/` and `schemas/` — those
previews keep the full tree, correctly. The measured claim is *per preview,
when the branch does not touch those sources*; the fleet effect depends on the
mix and is not measured here.

Separately and not caused by this change: the total fell 878.7 → 741.2 MiB
while this was being written, because #833 and #838 merged and their previews
were reaped automatically. The auto-removal works; it was never the problem.


---

## The check's own two defects, corrected

`test/health/checks.ts` — the documented basis, and the `basis` string the
report carries.

### The calibration was stale by more than 2x

It reasoned from *"the measured ~38 MB per preview"*, so *"500 MB is about
thirteen concurrent reviews"*. At the measured **~88 MiB** it is about **five
or six** — below the concurrency this repository reaches routinely, which is
why an ordinary working day tripped `critical`. A threshold that always fires
has stopped discriminating.

**`STAGING_WARN_BYTES` is left at 500 MB.** That value is the owner's
(*"set stagfing to 500mb"*); what was wrong is the arithmetic beneath it, and
whether the number still buys what they wanted is theirs to decide, not a
thing to quietly recalibrate.

### Two budgets, and the threshold is about one of them

The basis gave a **deduplication** argument — zero HTML blobs shared, nine
previews storing nine copies — as the reason to act on a threshold stated
against *"the documented 1 GB Pages ceiling"*. Those are different budgets:

| budget | counts | does blob sharing help? |
|---|---|---|
| 1 GB Pages ceiling | the PUBLISHED tree, each preview materialising its own copies | **no** |
| `gh-pages` repository size | git objects, identical content stored once | yes |

Measured: **878.7 MiB summed, 616.7 MiB unique, 47.3 MiB shared.** Sharing now
exists — `g196` made the banner a constant fragment, which is exactly the
"most fundamental" source the doc still listed as live — and it still cannot
reduce what Pages counts.

The four addressing sources stay in the doc and stay worth fixing. They are a
repository-growth remedy, and the doc now says so rather than offering them
against the wrong limit.

### Severity has since dropped, and NOT mainly because of this

The report now reads `major` at 745.3 MB rather than `critical` at 878.7.
Attributed honestly: ~177 MiB of that is #833 and #838 merging and their
previews being reaped automatically; this bean's trim contributed by making
this branch's own preview add 39.2 MiB instead of ~88. The automatic drain
was doing its job the whole time — which is the point the finding's own
action missed when it proposed labelling previews for cleanup.

94 health tests pass; `bun run gates` 102/102.
