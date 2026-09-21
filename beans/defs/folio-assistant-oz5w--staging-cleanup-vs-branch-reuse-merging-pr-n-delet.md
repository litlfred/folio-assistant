---
# folio-assistant-oz5w
title: 'STAGING CLEANUP vs BRANCH REUSE: merging PR N deletes the preview PR N+1 just published'
status: todo
type: task
created_at: 2026-09-21T20:12:17Z
updated_at: 2026-09-21T20:12:17Z
parent: folio-assistant-ahvw
---



Reported by the owner, 2026-09-21, as a bare fact: the staging URL **404s**.
It was not propagation.

## Measured on `gh-pages`, not inferred

This branch's preview has been **deleted four times today**, each time by the
`cleanup` job firing when one of this session's own PRs merged:

```
cf39207d  staging(cleanup): remove STAGING/claude-lhs-…  (PR #786 closed)
05f5cfae  staging(cleanup): remove STAGING/claude-lhs-…  (PR #783 closed)
24cc6d7f  staging(cleanup): remove STAGING/claude-lhs-…  (PR #763 closed)
8d821e41  staging(cleanup): remove STAGING/claude-lhs-…  (PR #758 closed)
```

## The defect, in one sentence

**The slug is derived from the BRANCH, the cleanup is triggered by the PR, and
a branch can outlive its PR.** A session that reuses one branch across
successive pull requests — which is this repository's own working pattern —
has every merge delete the preview the *next* PR just published.

The retention policy is right on its own terms. `staging-review` states it:
a merged PR's preview *"is the same thing the MAIN SITE now shows"*, so it is
redundant on the instant. What it has never met is a slug that is still in use
by an open PR at the moment the closing one fires.

## Why the URL 404s rather than going stale

Two mechanisms compound, and only the second is known:

1. `cleanup` removed the directory when #786 merged (19:51).
2. `stage` for #791 put it back (20:09) — so **the publish ref is correct right
   now**: `index.html`, 156,556 bytes.
3. But `check:ci-health` reports **48 of 100 recent Pages builds cancelled**,
   and names the cause: *"several sessions racing for the publish ref
   (`yzsj`), which is a different fix and is not done."*

A cancelled Pages build leaves the PREVIOUS state serving — and `ci-health`
calls that *"stale rather than down, and nobody is sent to fix anything"*.
**That reading is wrong for this case**, and that is the second finding here:
when the previous state is a DELETION, "stale" is a 404. Staleness is benign
only when the thing you are falling back to exists.

## The agent error this also exposed

I reviewed the preview from the publish ref, found the files, and reported it
good. The ref *was* good. `staging-review` correctly says Pages propagation is
not observable from a container and must be reported as unverified — and I did
say so. What I did **not** do was treat *"this directory was deleted eighteen
minutes ago by my own merge"* as a reason to doubt. The gh-pages history was
one command away and I did not look until the owner reported the 404.

**A preview whose slug was deleted within the hour is not in the ordinary
propagation window**, and the skill should say so.

## Done when

- [ ] `cleanup` does not remove a slug that another OPEN PR is still using —
      the liveness check `staging-cleanup-preflight.ts` already exists and is
      run by the DISPATCH path; the `pull_request_target: closed` path does
      not consult it
- [ ] `ci-health`'s "cancelled is stale rather than down" wording carries the
      exception: stale is benign only when the previous state is a live
      preview, never when it is a deletion
- [ ] `staging-review` gains the check that would have caught this: before
      reporting a preview good, look for a `staging(cleanup)` commit against
      this slug **newer than** the last `staging(...)` publish, and say so
- [ ] a re-publish path that does not need a code push — the dispatch used
      here (`feature-staging.yml` with `branch`) works and is not written down
      anywhere a reader would find it

## Not fixed here

The workflow change is `cleanup`'s, and it belongs to whoever owns
`feature-staging.yml`'s close path. `yzsj` (the publish-ref race) is a separate
open bean and this does not touch it.
