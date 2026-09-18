---
# folio-assistant-eoix
title: 'feature-staging races on gh-pages: concurrency group keyed on branch, not the shared ref'
status: todo
type: task
created_at: 2026-09-18T22:33:31Z
updated_at: 2026-09-18T22:33:31Z
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
