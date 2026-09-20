---
# folio-assistant-bm6d
title: 'STAGING: every deploy pushes TWO commits, so every deploy cancels its own Pages build'
status: todo
type: bug
created_at: 2026-09-20T11:44:36Z
updated_at: 2026-09-20T11:44:36Z
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
