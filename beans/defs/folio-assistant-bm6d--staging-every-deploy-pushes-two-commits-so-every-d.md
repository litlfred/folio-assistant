---
# folio-assistant-bm6d
title: 'STAGING: every deploy pushes TWO commits, so every deploy cancels its own Pages build'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-20T11:44:36Z
updated_at: 2026-09-20T16:00:26Z
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

and [`render-logging`](../../cat-harness/skills/folio-core/render-logging.md):
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
