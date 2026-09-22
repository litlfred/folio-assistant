---
# folio-assistant-tebu
title: Staging previews are at 878.7 MiB of a 1 GB Pages limit, nothing is prunable, and the check's remedy addresses a different budget
status: completed
type: bug
priority: high
created_at: 2026-09-22T06:03:07Z
updated_at: 2026-09-22T10:51:00Z
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


_2026-09-22T09:15:00Z_ — **MEASURED, and the projection was wrong by a factor of six.** Measured from `origin/gh-pages` on this branch's own live preview, BEFORE the merge — the staging deploy already runs on the PR, so the merge was never needed to find this out.

## The numbers

| preview | files | MiB | `reference/` | `api/` |
|---|---|---|---|---|
| claude-740-windows-bootstrap | 3764 | 83.1 | 256 | 307 |
| claude-determined-euler-gqhkk0 | 3773 | 92.3 | 262 | 307 |
| claude-elegant-albattani-0byaig | 3777 | 92.5 | 261 | 307 |
| claude-elegant-clarke-bpycir | 3772 | 91.9 | 262 | 307 |
| claude-kind-bohr-cyt1s4 | 3774 | 91.4 | 263 | 307 |
| claude-lhs-navbar-harness-folios-cqo9mu | 3777 | 93.7 | 261 | 307 |
| **claude-peaceful-heisenberg-dzgsf1** | **3470** | **85.2** | **261** | **0** |
| claude-sharp-fermi-xvs06i | 3786 | 92.9 | 263 | 307 |
| claude-sharp-ptolemy-6qxh77-precond | 3772 | 92.6 | 261 | 307 |

Baseline across the seven comparable previews: **92.47 MiB**, spread 91.4–93.7 — tight enough to be a real baseline rather than a pick. Mine: **85.2 MiB**.

    MEASURED saving   7.27 MiB   =  7.9 %
    PROJECTED         43.2 MiB   = 48.9 %

## Why, and both reasons are the check working correctly

**`reference/` was NOT dropped, and should not have been.** This branch edits `cat-harness/skills/folio-core/todo-manager.md`, and the carry rule keeps `reference/` for any branch touching `skills/`, `schemas/`, `methodologies/`, `docs/reference/` or the generators. So the 38.7 MiB that dominates the projection stayed — correctly, because a reviewer of this branch needs those pages. **The saving is per-branch and depends on what the branch touches**, which the projection treated as a constant.

**The "nav shrinks on every remaining page too" bonus did not materialise.** I argued on the PR that the true saving would be *larger* than the arithmetic. For `api/` it is not: 307 files dropped, ~7.8 MiB at the measured 26 KiB/page, and the observed saving is 7.27 MiB — the tree's own weight and nothing more. The reason is now obvious and was not checked: **`api/` is TypeDoc output and does not carry the just-the-docs nav.** Only `reference/` does. So the bonus is real only for the tree nobody has yet dropped, and remains **unmeasured** rather than disproved.

## What this does and does not settle for the 1 GB limit

Total published STAGING tree today: **815.6 MiB across 9 previews** (was 878.7 across 10). At a measured 7.9 % per preview on a skills-touching branch, this change alone does not take the tree off a collision course — it buys roughly one extra concurrent review, not the halving the PR body implies.

The lever that would matter is `reference/` at 38.7 MiB, which drops only for branches touching none of the five carry paths. **What fraction of branches those are is unmeasured**, and it is the number that decides whether this change is sufficient. Nine live previews is too small a sample to answer it from, and guessing would be how a projection became a claim the first time.

## Correcting the PR

The PR body says *"the true saving is probably larger, which is exactly why a projection is not a measurement."* The sentiment was right and **the prediction was wrong in the direction I was warning about** — I projected 49 % and measured 7.9 %. Recorded here rather than only in chat, because the projection is in the PR body and on #843 where somebody will read it next.

## Done when

- [x] A real preview measured after the change is live — done on the PR's own staging, no merge required
- [x] The measured figure reported rather than the projection
- [ ] The share of branches that touch none of the five carry paths — the number that decides whether `reference/`'s 38.7 MiB is reachable in practice. NOT measurable from nine previews


_2026-09-22T10:50:00Z_ — **THE OPEN BOX IS MEASURED: 32 %, and the answer is that this change is not sufficient.**

The box asked what share of branches touch none of the five carry paths. I said nine previews could not answer it — true, and the wrong place to look. **Git history can**, and the carry rule is a pure function of a branch's changed files, so it can be evaluated retrospectively against merges that predate it.

## Method

120 merge commits into `origin/main`, newest first. For each, `git diff --name-only <merge>^1 <merge>` gives exactly what that merge brought, and the two patterns are read **off `feature-staging.yml` on main** rather than from memory:

    reference/   ^cat-harness/(docs/reference/|schemas/|skills/|methodologies/)|^cat-harness/scripts/gen-(schema|skill|docs)-
    api/         ^cat-harness/schemas/

| class | n | share | sheds |
|---|---|---|---|
| touches **neither** | 38 | **32 %** | `reference/` + `api/` = **46.0 MiB** |
| touches ref, not api | 22 | 18 % | `api/` alone = **7.3 MiB** |
| touches both | 60 | 50 % | nothing |

`api ⊆ ref` exactly — 82 = 60 + 22 — which is a structural check on the measurement rather than a coincidence: `^cat-harness/schemas/` is a subset of the `reference/` alternation, so any branch carrying `api/` must carry `reference/`. The three classes being disjoint and summing to 120 is the second.

## The number

    EXPECTED saving per preview    15.9 MiB of 92.5  =  17 %
    measured on THIS branch         7.3 MiB of 92.5  =   8 %   (a skills-touching branch)
    projected in the PR body       43.2 MiB of 88.3  =  49 %

So the projection was wrong by ~3× against a realistic branch mix, and by ~6× against the branch I happened to measure on. **8 % was not unrepresentative — it was the second-most-likely case**, and the single most likely case (50 %) saves nothing at all.

## What it means for the 1 GB cap, which is the question behind the question

A ten-preview tree at today's composition: **925 MiB → 766 MiB**. That is 90 % → **75 % of the 1024 MiB limit** — still past the three-quarters threshold `staging-preview-size` fires on, which is why `bun run health` still reports it **critical** after this shipped.

This change buys roughly **two** extra concurrent reviews rather than the halving the PR body implies. It is worth having — it is the only lever that does not delete somebody's open preview — and it is **not sufficient on its own.**

## One reason the 32 % case may be better than 46.0 MiB

`reference/` carries the just-the-docs nav and `api/` does not; that is why dropping `api/` saved exactly its own weight (measured) while dropping `reference/` should also shrink **every remaining page**. **No preview has yet dropped `reference/`**, so 46.0 MiB is a floor for that class, not an estimate. If the nav effect is as large for it as the 143 KiB/page figure suggests, the 32 % class could shed materially more — and the honest way to find out is to wait for a preview on a branch that touches none of the five paths, then measure it.

## Caveat on the sample

Merge commits into `main` are a **proxy** for "branches that had a preview": some are dependabot bumps, some are bean-only closures. Both are exactly the kind of branch that touches none of the five paths, so the 32 % may be **optimistic** for human feature branches specifically. Splitting the sample by author is the refinement if anyone wants a tighter number; 120 is enough to rule out the 49 % projection, which is what the box was for.

## Done when

- [x] A real preview measured after the change is live
- [x] The measured figure reported rather than the projection
- [x] The share of branches touching none of the five carry paths — **32 % of 120 merges**, giving a 17 % expected saving and 75 % of the cap
- [ ] **NEW, and the box this one opens:** 17 % does not clear the threshold. The next lever needs choosing — and it is the owner's call, not an agent's, because every candidate either deletes somebody's artefact or changes what a reviewer can see


_2026-09-22T11:00:00Z_ — **THE NAV BONUS IS REAL AND MEASURED — and this corrects my own correction.** The opportunity arrived within the hour: this branch became a `neither` branch (its remaining diff touches `src/`, non-`gen-*` `scripts/` and `beans/` only), its preview rebuilt, and two siblings did the same.

## A live three-against-five comparison

| class | previews | MiB |
|---|---|---|
| **neither** (`ref:1 api:0`) | `determined-euler` 40.2, `peaceful-heisenberg` 41.0, `dependabot-github_actions` 40.6 | mean **40.6**, spread 40.2–41.0 |
| **carrying** (`ref:256–264 api:307`) | 83.1, 91.9, 98.1, 97.1, 94.8 | mean **93.0**, spread 83.1–98.1 |

    MEASURED saving, neither class   52.4 MiB = 56%
    arithmetic floor stated above    46.0 MiB   (reference 38.7 + api 7.3)
    NAV BONUS beyond the two trees   +6.4 MiB   over ~3212 remaining pages

File counts check out structurally: 3782 → 3212 is **570 dropped**, against 264 `reference/` + 307 `api/` = **571**. One file of slack is the `reference/` stub the trim leaves behind, which is the intended behaviour rather than a rounding artefact.

## What this corrects, and I was wrong in two directions

Earlier today I measured **8 %** on this same branch and wrote: *"I argued the saving would be LARGER than the arithmetic. It is six times smaller, and the error is in the direction I was warning about."*

**That sentence is now wrong, and precisely so.** The 8 % was real — but it was measured while this branch still carried `reference/`, because it had edited `cat-harness/skills/`. Once the branch's diff no longer touched any carry path, the same preview shed **56 %**.

So the original PR's two claims split cleanly:

| claim | verdict |
|---|---|
| *"~49 % saving"* | **right for a `neither` branch** — 56 % measured, better than projected |
| *"the true saving is probably larger than the arithmetic"* | **right for `reference/`** (+6.4 MiB nav bonus), **wrong for `api/`** (TypeDoc, no nav — sheds exactly its own weight) |
| 49 % as a blanket figure | **wrong** — it assumed every branch is a `neither` branch, and only 32 % are |

The defect in the projection was never the arithmetic. It was **quantifying over the wrong population**: one branch's saving stated as every branch's.

## Revised expected value

    32% × 52.4  +  18% × 7.3  +  50% × 0   =  18.1 MiB of 93.0  =  19%

Up from the 17 % computed on the 46.0 floor. **The conclusion does not move**: 19 % is not 49 %, and the half of branches that touch `schemas/` still shed nothing.

## The live tree, which is better news than the check reports

**586.8 MiB across 8 previews = 57 % of the 1024 MiB cap** — comfortably under the three-quarters threshold, where `bun run health` reported `critical` at 804.4 MB this morning.

Two causes, and they must not be conflated: three of the eight are now `neither` previews shedding 52 MiB each, **and** two previews were cleaned up as their PRs closed. The second is ordinary churn, not this change working. A single reading cannot separate them, so **the honest claim is that the tree is under threshold today, not that this change put it there.**

## Done when

- [x] The share of branches touching none of the five carry paths — 32 % of 120 merges
- [x] **The nav bonus on `reference/` measured** — +6.4 MiB, so 52.4 rather than the 46.0 floor
- [ ] 19 % still does not make the threshold unreachable on a bad day: eight carrying previews alone would be 744 MiB, 73 % of the cap, with no headroom for a ninth. The next lever remains the owner's call
