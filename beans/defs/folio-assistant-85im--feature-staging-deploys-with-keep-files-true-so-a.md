---
# folio-assistant-85im
title: 'feature-staging deploys with keep_files: true, so a staging preview can never show a deletion'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-19T13:19:51Z
updated_at: 2026-09-20T16:11:38Z
parent: folio-assistant-1xhc
---


_2026-09-19T13:25Z_ — Found while verifying PR #413's merge against the publish ref. Not claimed; recording the measurement so it is not lost.

## What was measured

`main` relocated all four proposals out of the rendered site to `fsh-guts/` on 2026-09-19 — kept and addressable, **deliberately unpublished** (beans `t0i3`, `uv09`, `yjjt`). The main-site deploy honoured that: `git ls-tree -r --name-only origin/gh-pages | grep -v '^STAGING/' | grep -i proposal` returns only `reference/skill-instructions/where-a-proposal-goes.html`, which is a legitimate skill doc.

The STAGING preview did not:

```
git ls-tree -r --name-only origin/gh-pages STAGING/claude-festive-galileo-s7ibx0/ | grep proposals/
  .../proposals/agents-md-migration.html
  .../proposals/bootstrap.html
  .../proposals/deployment-topologies.html
  .../proposals/index.html
  .../proposals/workflow-state-in-beans.html
```

Five pages the repository decided should not be published, served right now.

They are provably **stale, not rebuilt**. The deploy that ran after the merge is gh-pages `c190bc19c` (13:18:11). The last commit touching `STAGING/<slug>/proposals/bootstrap.html` is `aca09df0e` (12:34:09) — the PREVIOUS deploy. A page the current build does not produce was left untouched and is still served.

## Cause

`feature-staging.yml` deploys with `keep_files: true` (both the first attempt and the retry). `keep_files` is not path-scoped — `docs-site.yml` already records this in its own comment, for the opposite failure: *"`keep_files: true` is NOT the fix. It is not path-scoped, and the action offers nothing that is (`keep_files`, `force_orphan`, `exclude_assets`)."*

So this is the **price already paid for `plj1`**, not a new oversight. `plj1` was the main-site deploy wiping every open PR's preview because it had no `keep_files`. Staging carries `keep_files: true` to survive that, and the same flag that protects a sibling branch's directory also protects this branch's own dead files. The two failures are one tradeoff seen from its two ends, and the action offers no setting that separates them.

## Why it matters more than a stale page

A staging preview is what a reviewer opens to answer *"did my change take effect?"* — and this one is **structurally incapable of showing a removal**. It can only ever answer that question for additions. A reviewer checking whether the `fsh-guts` relocation worked gets a false negative from the one artefact built to tell them.

That is the `xom7` shape again — a defect indistinguishable from health from inside the repo — and it lands on the review surface rather than in CI. The deploy is green, the comment is posted, the URL resolves, and the content is wrong.

Compounding: previews accumulate monotonically, so `test/health/`'s gh-pages size check will read this as ordinary growth.

## Not done, deliberately

Nothing was deleted from `gh-pages`. `deletion-requires-confirmation` applies, and its own worked example is `plj1` — the workflow at the *other* end of this exact tradeoff, whose shape deleted every open PR's preview without anybody deciding it. Removing paths from a publish branch on an agent's own initiative is the failure this bean is adjacent to, not the fix for it.

## Done when

- [ ] A staging deploy for a branch reflects **deletions** as well as additions, without touching any other branch's `STAGING/<slug>/`.
- [ ] Whatever mechanism is chosen is path-scoped by construction rather than by a flag the action does not offer — the likely shape is an explicit clone + `rm -rf STAGING/<slug>` + copy + push, which `feature-staging.yml` already does in its cleanup job (lines ~583, ~763), so the primitive exists in this file.
- [ ] The tradeoff is written down where the next person meets it: `docs-site.yml`'s comment states one end, this states the other, and neither currently points at the other.
- [ ] Something notices. A green deploy that serves a removed page is the `xom7` shape; a check that the staged tree matches the built `_site` tree would close it, and is cheap because both are available in the same job.

---

## Re-measured 2026-09-20 — the mechanism is intact, the EXAMPLE washed out

`git ls-tree -r --name-only origin/gh-pages` reads fine (**5178 paths**, so
this is a determined answer and not an unreadable ref), and the bean's own
example slug `claude-festive-galileo-s7ibx0` is still present with **870
files** — but **zero** `proposals/` pages remain in any preview.

Not a fix. That slug belongs to **PR #540, created 2026-09-20T15:27** — a new
pull request reusing the branch name. The previous preview was removed when
its PR closed and the directory was rebuilt from nothing, which is the only
thing that clears stale files today.

Checked and ruled out as explanations:

- `feature-staging.yml` still deploys with `keep_files: true` on **all three**
  attempts, with no path-scoped clear. Read, not assumed.
- `restore-staging.ts` copies the `STAGING/` prefix **wholesale**
  (`copyPrefix`), so a full-replace deploy carries stale files across rather
  than dropping them.

**Fresh evidence was not constructed**, and saying so is the honest state: it
needs a branch that deletes a published page and then deploys, which is a real
push to the shared publish branch. The structural property is verified; a new
instance of it is not.

## `85im` AND `bm6d` ARE ONE FIX, and together they justify what neither did alone

Both die on the same line: `peaceiris/actions-gh-pages` offers no path-scoped
clear, and the deploy therefore cannot both (a) leave sibling previews alone
and (b) remove this preview's dead files.

The design that resolves both is the same one `bm6d` records — do the deploy in
**one git operation** with the rebase-and-retry loop the render log already
uses:

1. check out `gh-pages`
2. **`rm -rf STAGING/<slug>`** ← what `keep_files: true` cannot express, and all of `85im`
3. copy `_site` into `STAGING/<slug>/`
4. append the render-log entry — **one** commit, not two ← all of `bm6d`
5. push with rebase-retry, so a concurrent append is replayed rather than clobbered

**This changes the cost/benefit I recorded on `bm6d` hours earlier.** There I
judged the rewrite a poor trade, because `bm6d`'s harm is waste and latency and
the bean says the 404 that prompted it was not caused by it. `85im` is a
different kind of harm: a review surface **structurally incapable of showing a
removal**, answering *"did my change take effect?"* with a false negative for
every deletion. That is worth more than a wasted Pages build.

The cost is unchanged and still real: hand-rolled git in the deploy path of
every session's preview, **untestable from a checkout**. That is a decision for
the author, not for me, and it is the question being brought back.
