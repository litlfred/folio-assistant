---
# folio-assistant-bm6d
title: 'STAGING: every deploy pushes TWO commits, so every deploy cancels its own Pages build'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-20T11:44:36Z
updated_at: 2026-09-20T16:19:24Z
parent: folio-assistant-1xhc
---


Found while diagnosing an owner-reported 404 on a staging preview, 2026-09-20.
The 404 was not explained by this — the file was present at **every** `gh-pages`
commit for 100 minutes — but the measurement below came out of the same look and
is a defect on its own terms.

## Measured

- **64 commits to `gh-pages` in 90 minutes**, from four concurrent agent sessions.
- **6 of the last 10 `pages build and deployment` runs: `cancelled`.**
- The cancellation pattern is **exact, not random**. Each staging deploy pushes
  *two* commits about ten seconds apart:

      9eef6972  11:24:49  staging(claude-sleepy-rubin-mr6kdu): from 72e1379…
      cbe3b6ba  11:25:00  render-log: rendered STAGING/claude-sleepy-rubin-mr6kdu

  Pages starts a build on the first and the second cancels it. Two pushes, two
  builds, and the first is **always** wasted.

## Why it matters beyond tidiness

1. **It halves the useful deployment rate** on a ref that four sessions are
   already contending for, which widens the window in which a freshly pushed
   preview is not yet the tree being served. That window is exactly what makes a
   preview 404 hard to diagnose — see `github-state-inspection`
   §"Present on the ref is not the same as SERVED".
2. **A `cancelled` deployment is invisible as a failure.** Nothing is red.
   `check:ci-health` reads workflow state on the default branch; these runs are
   on `gh-pages` and are bot-triggered (`github-pages[bot]`, event `dynamic`), so
   no report here covers them. That is the `xom7` shape again: a thing failing
   repeatedly with nothing in the repository saying so.
3. It is **self-inflicted and local**. Unlike the contention between separate
   sessions, both commits come from one workflow run.

## The fix, and the thing to check before taking it

Write the render-log entry into the **same commit** as the staging payload, so
one deploy is one push and one Pages build. `feature-staging` already composes
the payload; the render-log append is a second step against the same working
tree.

Before doing it, check why they are separate — `render-logging` and
`restore-staging.ts` both touch the log, and the split may be load-bearing for
the cleanup path (a removal writes a log entry with no payload). If so, the fix
is to coalesce only when a payload is present, not to merge the steps
unconditionally.

`pdxk` (archived) converged the gh-pages pushers on one queue with retry; this is
the remaining half — the queue serialises *between* workflows, and this is one
workflow pushing twice.

## Done when

- [ ] A staging deploy produces ONE commit on `gh-pages`.
- [ ] The cleanup path still records a removal with its reason (it has no
      payload to coalesce with, so it must keep working).
- [ ] Measured after: `cancelled` runs over a comparable window are not caused by
      a repository's own consecutive pushes. Other sessions still contend, so
      the target is *zero self-cancellations*, not zero cancellations — a bean
      that claims the latter will read as failed forever.

## Not in scope

The cross-session contention on `gh-pages`, and the `docs-site.yml` full-replace
question. Different causes, and `6pfo` / `1feu` hold that ground.


_2026-09-20_ — Claimed by `claude/ecstatic-goldberg-eroyaz`.


## 2026-09-20 — one commit, and the split was NOT load-bearing

### The pre-check this bean named, answered

> *"check why they are separate — the split may be load-bearing for the cleanup
> path (a removal writes a log entry with no payload)."*

**It is not.** The `cleanup-dispatch` job already coalesces, and says so:

```
git add -A "STAGING/$CLEANUP_SLUG" _render-log
git commit -m "staging(cleanup): remove STAGING/$CLEANUP_SLUG (dispatched)" ...
```

> *"The record rides in the SAME commit as the removal, so a preview cannot
> vanish without an entry saying who dispatched it and why."*

So the pattern was already proven in this same file. The **retained** path
(`cleanup` job) is the genuine no-payload case the warning describes — a PR
closed whose preview was kept — and it legitimately commits the entry alone.
Untouched, and now pinned by a test so it stays that way.

### Why they were split, and why that reason is now gone

The workflow recorded it:

> *"It cannot ride in `_site`. The deploy above writes into `destination_dir`,
> so the entry would land at `STAGING/<slug>/_render-log/` — inside the very
> directory a cleanup removes, which is the one place a record of the removal
> must not be."*

Real, and specific to `peaceiris/actions-gh-pages`: `destination_dir` confines
it to the slug directory, so as long as the action deploys the payload the
entry needs a second push. Checking the branch out and committing by hand
removes the constraint — payload to `STAGING/<slug>/`, entry to `_render-log/`
at the root, **one `git add`, one commit**.

Three `peaceiris` steps and one log commit became one checkout and one commit.

### Two consequences worth stating rather than burying

1. **The log is now ATOMIC with the deploy.** The old log step was
   `continue-on-error` — *"a gap in the record is not a failed deploy"*. One
   commit cannot offer that: there is no deploy to succeed without it. The
   stronger property is worth more, since a preview that exists with no entry
   saying where it came from is the question `5mg5` added the log to answer.
2. **The third attempt's justification is partly dissolved.** The note that
   bought it counted the log adding a second push, *"a ~38% rise in write
   volume, after which attempt 2 started losing the race"*. Halving this
   workflow's writes attacks that cause. The loop is **kept** anyway — the
   contention BETWEEN sessions is untouched and is `6pfo`'s ground.

### `keep_files: true` preserved exactly, and deliberately so

A plain `cp -R` adds and overwrites and never deletes, which is what the flag
did: every other branch's preview survives (the `plj1` protection) **and** so
do this slug's own stale files. That second half is a defect — `85im` holds it
— and fixing it here would widen a change about push COUNT into one about
preview CONTENT.

### Done when

- [x] **A staging deploy produces ONE commit on `gh-pages`** — one writer in
      the `stage` job, pinned by `scripts/tests/staging-one-commit.test.ts`.
- [x] **The cleanup path still records a removal with its reason** — it always
      did; now asserted, along with the retained path's log-only commit.
- [ ] **Measured after: no self-cancellations.** NOT closable by me today. It
      needs observation of `pages build and deployment` over a comparable
      window once this is on `main`, and the bean rightly sets the target at
      *zero SELF-cancellations*, not zero cancellations. See the question
      below.

### Verification

7 checks, six mutations each caught by a named one — including *"the second
push is reintroduced as its own step"*, which is the regression that matters,
because re-adding one was free and invisible before. `check:workflows` passes
(39 workflows), `workflow-yaml.test.ts` 99 pass, 3985 pass / 0 fail, 60 gates.

**What could not be tested here:** a gh-pages deploy cannot be exercised
locally. The change runs on this branch's own next push, so the first real
measurement is the commit count that deploy produces.

## QUESTION FOR THE AUTHOR

**Who measures Done-when #3, and against what window?** The run data lives in
`pages build and deployment` on `gh-pages` — bot-triggered, on a non-default
ref, covered by no report in this repository (that is this bean's own point 2).
So either someone looks by hand after a few deploys, or the gap that made this
invisible stays open and the bean closes on a property rather than an outcome.
My recommendation: close on the property (one commit, tested) and open a
separate item for *"nothing here can see `gh-pages` build outcomes at all"* —
which is `xom7` one ref over, and bigger than this bean.


## MEASURED ON THE REAL REF, 2026-09-20 16:14–16:17Z — with three live controls

The change was dispatched against this branch and the result read off
`gh-pages` directly. Three sibling sessions deployed in the same two minutes
**still running the old code**, which makes this a natural experiment rather
than a single observation:

```
d1840f2eaf  16:17:27  staging(cleanup): remove STAGING/claude-fervent-mccarthy-nw4olk (PR #547 closed)
2e240eeb14  16:17:14  render-log: rendered STAGING/claude-brave-hypatia-r820sf      ← control, 2nd
2ee65a5434  16:17:04  staging(claude-brave-hypatia-r820sf): from 7d3f78d6…          ← control, 1st
617cfefb06  16:16:24  staging(claude-ecstatic-goldberg-eroyaz): from ee90b3cb19…    ← THIS BRANCH
f8c754a78f  16:15:54  render-log: rendered STAGING/claude-fervent-mccarthy-nw4olk   ← control, 2nd
af5d5e1912  16:15:44  staging(claude-fervent-mccarthy-nw4olk): from 407c506c…       ← control, 1st
747f16955c  16:15:05  render-log: rendered STAGING/claude-wonderful-gauss-7frcrw    ← control, 2nd
4dfe0e6959  16:14:56  staging(claude-wonderful-gauss-7frcrw): from aa59ca8a…        ← control, 1st
```

**Three branches, two commits each, ten seconds apart. This branch: one, with
no `render-log:` commit following it.**

And the record is intact rather than dropped — the single commit carries both:

```
$ git show --stat 617cfefb06
 STAGING/claude-ecstatic-goldberg-eroyaz/…            716 files
 _render-log/2026-09-20.jsonl                           1 +

{"$schema":"folio-render-log/v1","event":"rendered",
 "subject":{"kind":"staging-preview","path":"STAGING/claude-ecstatic-goldberg-eroyaz",…},
 "branch":"claude/ecstatic-goldberg-eroyaz",
 "commit":"ee90b3cb19bbfce9b6ee7e5aed3ee4afec54348a",
 "run":"https://github.com/litlfred/folio-assistant/actions/runs/35522103984"}
```

`_render-log/` is at the **root**, not under `STAGING/<slug>/` — which was the
constraint that forced the split in the first place, and is the one thing a
cleanup must not remove along with the preview.

So Done-when #1 is measured on the ref rather than argued from the file, and
Done-when #2's sibling property — the record surviving — is measured too.

**Still open, unchanged:** Done-when #3 needs `pages build and deployment`
outcomes over a window, which nothing in this repository can see. The question
for the author stands.
