---
# folio-assistant-pb4n
title: 'STAGING: the gh-pages retry handles a rejection but not a CONFLICT — the daily render log collides by construction'
status: todo
type: bug
priority: normal
created_at: 2026-09-20T20:32:53Z
updated_at: 2026-09-20T20:33:25Z
parent: folio-assistant-1xhc
---

Measured on PR #603, 2026-09-20, and the log is unambiguous:

```
! [rejected]        gh-pages -> gh-pages (fetch first)
push rejected; rebasing onto origin/gh-pages and retrying
CONFLICT (content): Merge conflict in _render-log/2026-09-20.jsonl
error: could not apply e415631... staging(claude-elegant-albattani-0byaig)
```

## The gap, stated precisely

`feature-staging.yml` already carries the analysis for the race itself. Its own
comment:

> The queue above covers staging-vs-staging. It does NOT cover the five OTHER
> workflows that push to `gh-pages` — blueprint, discoverability-docs,
> docs-site, lean_ci and publish — because a concurrency group only serialises
> the jobs that name it, and none of them do. So the push is also retried once.

**The retry handles a REJECTION. It cannot handle a CONTENT CONFLICT.** And
`_render-log/<date>.jsonl` is the one file in the payload guaranteed to produce
one: every run appends a line to the SAME day's file, so two runs on the same
day whose pushes interleave conflict on it by construction, not by bad luck.

So the deploy is lost for a reason the existing mitigation was never shaped to
catch, and the job goes red on a branch whose own tree is correct — which is
the same class as the projection-staleness gate the owner had removed earlier
the same day: **a red that is not an omission by whoever sees it.**

## The fix, and why it is this one

A `.gitattributes` on **`gh-pages`** (the branch being rebased, not `main`):

```
_render-log/*.jsonl merge=union
```

`merge=union` is a built-in git driver that takes the added lines from BOTH
sides. For an append-only log that is not a heuristic — it is the correct
semantics, and it is the whole reason the driver exists. The existing
three-attempt rebase loop then succeeds where it currently aborts.

**Measured before proposing:** no `.gitattributes` exists anywhere in this
repository today, so this introduces the file rather than editing one.

### What it does NOT fix, and that matters

- **Ordering.** Union concatenates; it does not sort. If anything ever reads
  the log expecting chronological order, that assumption breaks the first time
  two runs interleave. Check before relying on it — and if order matters, the
  entries carry timestamps and the reader should sort rather than the file.
- **A genuine conflict elsewhere in the payload.** The driver is scoped to
  `_render-log/*.jsonl` on purpose. Widening it to `*.jsonl` would silently
  union-merge files where a conflict is real information.
- **The race itself.** This makes the retry succeed; it does not stop six
  workflows contending for one ref. That is the larger question and it is not
  this bean.

## Why it was not done on PR #603

The PR is the schema/library subject pages. It touches nothing under
`_render-log/`, `feature-staging.yml`, `gh-pages` or `.gitattributes` —
verified with `git diff --name-only origin/main...HEAD`. Widening a PR onto
the CI infrastructure it happens to trip over is how a reviewable diff stops
being one, and the repository's own rule says to propose the patch rather than
absorb it.

## Done when

- [ ] `gh-pages` carries a `.gitattributes` scoping `merge=union` to
      `_render-log/*.jsonl`, and nothing wider.
- [ ] Falsified: two interleaved staging pushes on one day both land, with
      both lines present in the log.
- [ ] The ordering question above is answered — either no reader depends on
      line order, or the reader sorts by the entry's own timestamp.



---

## How this differs from `yzsj`, which was opened the same hour

`yzsj` ("gh-pages race is back") arrived on `main` while this was being
written, from a parallel session. **They are not duplicates, and the line
between them is worth stating so neither gets closed by the other's fix:**

| | `yzsj` | this bean |
|---|---|---|
| the failure | `! [rejected] … (fetch first)` | `CONFLICT (content)` during the retry's rebase |
| what it is about | **preventing** the race — nine push sites, three of which no longer name `gh-pages-push` | **surviving** it when prevention fails |
| the fix | restore the concurrency invariant `xd1s` established | `merge=union` on the append-only log |

A retry exists precisely because prevention cannot be complete — `yzsj`'s own
table shows `feature-staging.yml` is outside the group **deliberately, with a
measurement**. So the retry is load-bearing by design, and it currently aborts
on the one file guaranteed to conflict.

**Fixing `yzsj` alone would make this rarer and not gone**; fixing this alone
would leave the contention `yzsj` names. Whoever takes either should read the
other first.
