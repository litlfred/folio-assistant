---
# folio-assistant-eoix
title: 'feature-staging races on gh-pages: concurrency group keyed on branch, not the shared ref'
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:33:31Z
updated_at: 2026-09-18T23:11:23Z
---


**Measured 2026-09-18**, PR #291, run 35401514230 job 105782404400.

The `stage` job built the whole staging site, then lost the push:

    [command]/usr/bin/git push origin gh-pages
     ! [rejected]        gh-pages -> gh-pages (fetch first)

`.github/workflows/feature-staging.yml:53` guards the wrong resource:

    concurrency:
      group: staging-${{ github.event.pull_request.head.ref || github.ref_name }}
      cancel-in-progress: true

That serialises staging runs **within one branch**. Every branch's staging run
pushes to the **same** `gh-pages` ref, so runs from different branches are
unserialised and race. Three were in flight inside one minute —
`claude-festive-galileo-s7ibx0`, `claude-nup0-manifests`, and
`claude-ecstatic-goldberg-eroyaz` — and `peaceiris/actions-gh-pages@v4` does not
retry a rejected push.

**Why it matters more than one red run.** It fires at random whenever two
sessions push within about a minute, which is the normal working pattern here
with several `claude/*` branches live. A `stage` that means "somebody else
pushed first" is indistinguishable from a `stage` that means the site is
broken, and the AGENTS.md CI-health premise is exactly that people stop reading
a check that cries wolf. It also self-heals on the next push, which is worse,
not better: it teaches "just push again" instead of being fixed.

## Done when

The push is serialised on the **contended resource** rather than on the branch.
Job-level concurrency on the `stage` job:

    stage:
      runs-on: ubuntu-latest
      concurrency:
        group: gh-pages-push        # the shared ref, not the branch
        cancel-in-progress: false   # queue; never cancel a sibling's preview

`cancel-in-progress: false` is load-bearing. Making the *workflow-level* group a
constant instead would cancel other branches' in-flight staging, and each
branch's preview is wanted — that would trade a rare lost push for routinely
missing previews. The workflow-level per-branch group stays: it correctly
cancels superseded runs of the same branch.

Check the same defect in the `cleanup` job, which also runs a bare
`git push origin gh-pages` (feature-staging.yml:426) and is equally unguarded.

## Summary of Changes

**The bean under-counted the contention: SIX workflows push to `gh-pages`,
not one** — `blueprint`, `discoverability-docs`, `docs-site`, `feature-staging`,
`lean_ci` and `publish`. That changes what a fix can claim, because a GitHub
concurrency group only serialises the jobs that *name* it. Adding the group to
`feature-staging` alone cannot serialise the ref.

So both halves, and each covers what the other cannot:

1. **Job-level `concurrency: {group: gh-pages-push, cancel-in-progress: false}`**
   on `stage` and `cleanup`. This fixes the *observed* failure, which was
   staging-vs-staging: three runs of this one workflow inside a minute.
   `cancel-in-progress: false` is load-bearing — making the workflow-level
   group a constant instead would cancel sibling branches' in-flight staging,
   trading a rare lost push for routinely missing previews.
2. **One retry on the push.** This is what covers the other five workflows,
   which will not be in the queue. The deploy step takes `id` +
   `continue-on-error`, and a second step re-runs it on failure — the action
   re-fetches `gh-pages`, which is what the rejection asked for. A retry
   failure still fails the job: a lost staging deploy must stay visible. The
   `cleanup` job's bare `git push` gets a 3-attempt rebase loop, safe because
   its commit only removes one `STAGING/` directory.

**Not done, and it is the user's call:** bringing the other five workflows into
the same group would serialise the ref completely. It touches five CI files
that this bean never measured, so it is recorded rather than done.
