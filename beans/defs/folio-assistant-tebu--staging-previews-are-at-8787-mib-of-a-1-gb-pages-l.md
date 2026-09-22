---
# folio-assistant-tebu
title: Staging previews are at 878.7 MiB of a 1 GB Pages limit, nothing is prunable, and the check's remedy addresses a different budget
status: todo
type: bug
priority: high
created_at: 2026-09-22T06:03:07Z
updated_at: 2026-09-22T06:03:07Z
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
- [ ] The saving is measured on a real preview, not projected
- [ ] The check's stale ~38 MB calibration is corrected to the measured figure
- [ ] The basis stops naming blob sharing as the remedy for a published-size
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

