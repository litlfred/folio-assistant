---
# folio-assistant-85im
title: 'feature-staging deploys with keep_files: true, so a staging preview can never show a deletion'
status: completed
type: bug
priority: normal
created_at: 2026-09-19T13:19:51Z
updated_at: 2026-09-20T17:03:08Z
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

## DONE 2026-09-20 — and it had become small, because a sibling moved the push

This bean said the likely shape was *"an explicit clone + `rm -rf
STAGING/<slug>` + copy + push, which feature-staging.yml already does in its
cleanup job… so the primitive exists in this file."* By the time it was worked,
the primitive was no longer only in the cleanup job: a sibling had already
taken the DEPLOY off `peaceiris/actions-gh-pages` and onto an explicit
checkout + copy + push (bean `bm6d`, one commit per deploy). Its comment named
what was left:

> `keep_files: true`, preserved exactly. A plain copy adds and overwrites and
> never deletes… That second half is a defect — bean `85im` holds it — and
> fixing it here would widen a change about push COUNT into one about preview
> CONTENT.

So the fix is one `rm -rf` of one named directory before the copy. Not a flag,
not a wider clone: **path-scoped by construction**, naming exactly one slug.
Every other branch's preview is untouched, so the `plj1` protection holds for
the reason it always did — this deploy has no reason to reach outside its own
slug.

### The hazard, and why it is unreachable rather than unlikely

An empty `$STAGING_SLUG` would make the removal `pages/STAGING/`, which is
every open PR's preview — `plj1` exactly, from the other direction. Bean
`fuzm` had already hardened the `slug` step to refuse `""`, `.` and `..` by
value, and `/` is not in its permitted character class.

But the value crosses a job boundary as an output between that check and this
use, and this file's own rule is *"checked by VALUE, never trusted because of
where it came from"*. So the deploy step re-checks it in four lines before the
line that deletes anything.

### Both ends of the tradeoff now point at each other

The third box asked for this specifically. `docs-site.yml` recorded one end (a
full replace deleting every preview) and `feature-staging.yml` the other (an
overlay that cannot show a removal), and neither named the other. They do now,
and a test asserts it — a reader who meets one end and fixes it without seeing
the other reintroduces the one they did not read.

### Pinned, because a stale preview is red nowhere

The deploy is green, the bot comments the URL, the check run passes, and the
content is wrong. Re-adding an overlay would be free and invisible. 5 tests,
falsified both ways: reverting to an overlay fails 1, widening the `rm` to the
STAGING root fails 2.

One of them failed on its own prose first — the warning above the `rm` spells
`pages/STAGING/` while explaining why that spelling must never be reached.
Comment lines are stripped now, the same distinction `folio-root-is-asked` and
`workflow-paths-resolve` both draw.

## Done when

- [x] a staging deploy reflects deletions as well as additions, without
      touching any other branch's `STAGING/<slug>/`
- [x] path-scoped by construction rather than by a flag the action does not offer
- [x] the tradeoff written down where the next person meets it, at both ends

Nothing was deleted from `gh-pages` by hand. The stale pages this bean
measured will go on the branch's next deploy, by the mechanism rather than by
an agent's initiative — which is what `deletion-requires-confirmation` asks
for, and what `plj1` is the worked example of getting wrong.


## 2026-09-20 — a NEAR MISS by a sibling session, recorded because the rule did not prevent it

`claude/ecstatic-goldberg-eroyaz` set this bean back to `in-progress` **after
it was completed**, and appended a claim note to it. Nothing was pushed, and
the status is restored to `completed` here.

**How it happened, since the mechanism matters more than the slip.** That
session picked this bean off a listing, then ran `git merge origin/main`
and `beans update --status in-progress` in the same breath. The merge brought
in the completion; the claim overwrote it **without re-reading the bean**.
`bean-coordination` §"Closing a bean whose work has already landed" tells an
agent to re-derive before it *closes* a bean — it says nothing about
re-reading before it *claims* one, and a claim is equally destructive in the
other direction.

Claiming is a WRITE to a shared store, and the same obligation applies:
**re-read the bean after syncing and before claiming it**, because a sibling
may have finished it in the window. The window here was under a minute.

Caught by comparing `git show origin/main:<bean>` against the working tree
before committing. Had that comparison not been made, a completed bean would
have been reopened with a claim from a session that did none of the work.

**Nothing else from that session's plan applied here** — the `rm -rf`, the
slug re-check and the tests were all already yours. The one item it carried
that this bean does not cover is an **empty-build guard**, approved by the
owner in the same breath as the `rm -rf`; it is a risk this fix introduces
rather than part of its Done-when, so it is filed separately.
