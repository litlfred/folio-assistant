---
# folio-assistant-bm6d
title: 'STAGING: every deploy pushes TWO commits, so every deploy cancels its own Pages build'
status: completed
type: bug
priority: normal
created_at: 2026-09-20T11:44:36Z
updated_at: 2026-09-20T16:34:05Z
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

## Checked 2026-09-20 — the split IS load-bearing, exactly as this bean warned

The precondition above ("check why they are separate") was checked, and the
answer is written into the workflow itself:

> It cannot ride in `_site`. The deploy above writes into `destination_dir`, so
> the entry would land at `STAGING/<slug>/_render-log/` — inside the very
> directory a cleanup removes, which is the one place a record of the removal
> must not be.

So the record must live OUTSIDE `STAGING/<slug>/`, and `peaceiris/actions-gh-pages`
publishes into one `destination_dir` per invocation. **One payload push and one
log push is not an oversight; it falls out of the deploy mechanism.**

### So coalescing means changing the deploy mechanism, and both ways are real changes

1. **Replace peaceiris with manual git in the existing `pages` checkout** —
   copy `_site` into `pages/STAGING/<slug>/`, write the log into
   `pages/_render-log/`, one commit, one push through the rebase-and-retry loop
   the log step already has. Clean, and it reimplements whatever peaceiris does
   about deletions and `keep_files` (see `85im`, which is about exactly that
   flag) by hand.
2. **Publish a tree containing both** — `publish_dir` holding
   `STAGING/<slug>/…` *and* `_render-log/…`, `destination_dir` at the root,
   `keep_files: true`. One invocation, one push, and it changes what a deploy
   is scoped to delete — on a ref four concurrent sessions write to.

### Why it stops here rather than being guessed

`feature-staging.yml` deploys **every open PR's preview**, and there are nine.
Neither option is verifiable beyond `check:workflows` (YAML parses) without
driving a real runner, and both change deletion semantics on a shared ref.
That is a different risk class from `35kc`, which was purely ADDITIVE — adding
documents a preview did not publish could not break one that did, and its shell
block was rehearsed end to end locally. This cannot be rehearsed the same way:
the thing under test is what the deploy action deletes.

**Needs the owner to pick the mechanism.** The diagnosis is complete and the
fix is not a judgement call about correctness — it is a choice about which
deploy machinery to own.

---

## Two sessions analysed this independently, and both records are kept

The section above and the one below were written by different sessions within
hours of each other, neither aware of the other, and they agree. Kept as two
rather than merged into one: they answer different questions, and a merged
paraphrase would lose which evidence supports which claim.

- **Above** — WHY the two pushes exist: `peaceiris` writes into one
  `destination_dir` per invocation, and the render log must live outside
  `STAGING/<slug>/` because that is the directory a cleanup removes.
- **Below** — what to DO about it, and why the trade changed: the sibling
  session connects this to `85im` (`keep_files: true` cannot express
  `rm -rf STAGING/<slug>`), which makes the combined fix worth more than
  either alone. A wasted Pages build is waste; a review surface that cannot
  show a REMOVAL answers "did my change take effect?" with a false negative.

**They reach the same conclusion by different routes, which is the strongest
form this could take**: the fix is one git operation with a rebase-and-retry
loop, and the cost — hand-rolled git in the deploy path of every preview,
untestable from a checkout — is the author's call rather than an agent's.

---

## The obvious fix is WRONG, and the reason is in `render-log.ts` itself

Analysed 2026-09-20 by the session that caused this — the second commit is the
render log (bean `5mg5`), and `feature-staging.yml:551` carries that session's
own count: *"14 render-log: … added by the log, where there were none"*.

The tempting collapse is to stage one tree containing both
`STAGING/<slug>/` and `_render-log/`, publish it at the branch root with
`keep_files: true`, and get one commit. **It would lose log entries.**

`peaceiris/actions-gh-pages` copies `publish_dir` over a fresh clone. The
staged `_render-log/<date>.jsonl` would be read at checkout time and written at
deploy time, so anything a concurrent session appended in between is
**overwritten**. That property is not incidental — `render-log.ts:108`:

> `appendFileSync`, never read-modify-write: six workflows publish to this

and [`render-logging`](../../../cat-harness/skills/folio-core/render-logging.md):
*"whatever landed in between, and the tool appends a line rather than
rewriting."*

**So the collapse trades a wasted Pages build for a silently lost record of a
deleted preview** — which is bean `plj1`'s shape, the thing the log was built
to end. A worse bug than this one.

## The safe design, and it is bigger than this bean assumes

Do the whole deploy in one git operation with the rebase-and-retry loop the
log push already uses:

1. check out `gh-pages`
2. copy `_site` into `STAGING/<slug>/` (no delete — what `keep_files: true` means)
3. append the log entry with `render-log.ts --dir <checkout>`
4. **one** commit, pushed with the existing rebase-retry loop

A real `git rebase` replays the append onto whatever landed in between, so
append-only survives — which the action's copy-over-clone cannot do. One
commit, one Pages build, record intact.

**The cost is replacing a well-tested third-party action with hand-rolled git
in the deploy path of every session's review preview.** The pattern is already
proven in this file (the log push uses exactly that loop), but it cannot be
tested from a checkout: a mistake here loses review surfaces for everybody.

## What this bean is actually worth

Re-read before recommending: this bean says the 404 that prompted the look was
**not** explained by it. The harm is waste and latency — a cancelled build
restarts, so the preview appears later — not a lost preview. Weigh that
against rewriting the deploy path untested.

Left as analysis, not a change. The next session has the trap written down.

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
---

## BOTH SESSIONS' NOTES ARE KEPT BELOW — they converged, and the second half answers the first

Two sessions worked this bean within hours of each other and **arrived at the
same design independently**. Neither is redundant:

- The **analysis** (next) is the sibling's, and it carries the thing the
  implementation notes do not: *why the cheap collapse is wrong*. Staging one
  tree with `_render-log/` in it and publishing at the branch root with
  `keep_files: true` gives one commit and **loses log entries**, because
  `peaceiris` copies `publish_dir` over a fresh clone and clobbers whatever a
  concurrent session appended. That is `plj1`'s shape — a silently lost record
  of a deleted preview — and a worse bug than this one. It is the reason the
  manual-git route was taken rather than the two-line one.
- The **implementation and measurement** (after it) is this session's, and it
  discharges the cost that analysis flagged as the author's decision.

**What changed between them, and it is the whole point:** the sibling closed
with *"the cost is unchanged and still real: hand-rolled git in the deploy path
of every session's preview, **untestable from a checkout**. That is a decision
for the author."* It has since been written, run against the real ref, and
measured with three concurrent sessions as controls. **The expensive, risky
part is done.** See the question at the end.


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


## THE QUESTION, restated now that the expensive part is paid

The sibling's note above closed by putting the rewrite to the author, because
its cost was *"hand-rolled git in the deploy path of every session's preview,
untestable from a checkout"*.

**That is no longer the question, because the rewrite is done and measured.**
Steps 1, 3, 4 and 5 of the design in that note are on this branch, dispatched
against the real ref, and verified with three concurrent sessions running the
old code as controls: three branches produced two commits each, this one
produced one, and its single commit carries the payload and the root
`_render-log/` entry together.

What is missing is **step 2 — `rm -rf STAGING/<slug>` before the copy** — which
the note correctly identifies as *"what `keep_files: true` cannot express, and
all of `85im`"*.

It was left out deliberately: this change was about push COUNT, and deleting a
preview's files is about preview CONTENT. But the sibling's argument that the
two are one fix is right, and the balance has shifted:

| | before | now |
|---|---|---|
| cost of the rewrite | a rewrite, untestable from a checkout | **paid, and measured on the ref** |
| cost of adding `85im` | the same rewrite again | **one line**, `rm -rf` |
| harm `85im` does meanwhile | a review surface structurally unable to show a removal | unchanged |

**QUESTION 4 FOR THE AUTHOR:** add `rm -rf "pages/STAGING/$STAGING_SLUG"`
before the copy, closing `85im` too?

What it changes: a deploy would then mirror the build exactly, so a reviewer
asking *"did my deletion take effect?"* gets a true answer for the first time.
What it risks: a preview is briefly absent between the `rm` and the commit
(local to the checkout, so not visible on the served ref), and a build that
produces nothing would empty a preview rather than leave the last good one —
which is arguably correct and arguably not. `plj1`'s protection is untouched
either way: the `rm` is scoped to this slug, and every sibling's directory is
outside it.

My recommendation: **yes**, in its own PR against `85im`, not bolted onto this
one — so the push-count change and the content change can be reverted
independently if the second turns out to be wrong.


## CLOSED 2026-09-20 — owner's decision, and the measurement re-checked on GitHub first

Owner, asked whether to close on the property and split the blindness off:
**"1 y (first check commit gh-pages on github)"**.

So it was re-checked **on GitHub**, not off a local fetch — the local clone had
just been force-updated on that ref, and reading a measurement from a tree you
also wrote is exactly the shortcut this session has been removing.

`GET /commits/617cfefb06` returns one commit whose message carries **both**
subjects:

```
staging(claude-ecstatic-goldberg-eroyaz): from ee90b3cb19bbfce9b6ee7e5aed3ee4afec54348a

render-log: rendered STAGING/claude-ecstatic-goldberg-eroyaz

https://github.com/litlfred/folio-assistant/actions/runs/35522103984
```

And the surrounding window on `gh-pages`, read from the API, shows **four**
concurrent controls rather than the three counted earlier — every one of them
two commits, nine to ten seconds apart:

| branch | commits |
|---|---|
| `claude-sleepy-rubin-mr6kdu` | `d6b53e03` 16:14:20 + `b4dbad26` 16:14:29 |
| `claude-wonderful-gauss-7frcrw` | `4dfe0e69` 16:14:56 + `747f1695` 16:15:05 |
| `claude-fervent-mccarthy-nw4olk` | `af5d5e19` 16:15:44 + `f8c754a7` 16:15:54 |
| `claude-brave-hypatia-r820sf` | `2ee65a54` 16:17:04 + `2e240eeb` 16:17:14 |
| **`claude-ecstatic-goldberg-eroyaz`** | **`617cfefb` 16:16:24 — one** |

Four for four on the old code, one on the new, inside three minutes on the
same ref.

### Done when — final

- [x] A staging deploy produces ONE commit on `gh-pages`. Tested in the file
      (`staging-one-commit.test.ts`, 7 checks, six mutations) **and** measured
      on the ref against four controls.
- [x] The cleanup path still records a removal with its reason. It always did —
      it was already the single-commit pattern this fix copied — and both it
      and the retained path are now asserted.
- [x] **Closed on the property rather than the outcome**, by the owner's
      decision. The outcome half needed `pages build and deployment` state,
      which nothing here can read; that is now **`3yi4`**, where it belongs —
      it is `xom7` one ref over and bigger than this bean.

### What this did NOT fix, deliberately

Contention *between* sessions still cancels builds, and `85im` — a preview
structurally unable to show a deletion — is still open. The sibling analysis
above is right that they are one fix; the expensive half is now paid, so
`85im` is a one-line `rm -rf`. **That question is open and unanswered.**
