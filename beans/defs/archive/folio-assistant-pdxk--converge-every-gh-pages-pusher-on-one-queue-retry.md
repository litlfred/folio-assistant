---
# folio-assistant-pdxk
title: Converge every gh-pages pusher on one queue; retry where a queue would drop a job
status: scrapped
type: task
priority: normal
created_at: 2026-09-18T23:33:47Z
updated_at: 2026-09-19T00:30:18Z
---


Finishes `folio-assistant-eoix`, and corrects it.

**Two defects found by looking rather than assuming.**

1. **PR #296 coined a group name that already existed under a different
   spelling.** `blueprint.yml` and `lean_ci.yml` have carried
   `concurrency: {group: gh-pages-deploy}` on their deploy jobs all along.
   #296 added `gh-pages-push` for the same contended ref — and a concurrency
   group only serialises the jobs that NAME it, so the fix was serialising
   feature-staging against nothing but itself. Two names for one resource is
   the same as no name. Converged on the pre-existing `gh-pages-deploy`.

2. **`discoverability-docs.yml` runs THREE parallel jobs that each push to
   `gh-pages`**, with no `needs:` between them — so they race each other on
   every single run, not just when branches collide. Worse than the staging
   race that motivated the bean.

   They must NOT join the queue. GitHub cancels a PENDING job when a newer one
   queues for the same group, so with three jobs wanting one group, one is
   silently dropped every run — a fix that loses a deploy is worse than the
   race. They get the retry instead, which is safe here because the three write
   to different directories, so a rebase-and-push loses nothing.

**Final coverage — every `gh-pages` pusher in the repo:**

| workflow | job | queue | retry |
|---|---|---|---|
| blueprint | deploy | `gh-pages-deploy` | — |
| docs-site | build-and-deploy | `gh-pages-deploy` | — |
| lean_ci | deploy | `gh-pages-deploy` | — |
| publish | deploy | `gh-pages-deploy` | — |
| feature-staging | stage | `gh-pages-deploy` | yes |
| feature-staging | cleanup | `gh-pages-deploy` | — |
| discoverability-docs | rust-api | — | yes |
| discoverability-docs | python-api | — | yes |
| discoverability-docs | schema-docs | — | yes |

## Reasons for Scrapping

**Superseded by #300**, which a sibling session opened ~7 minutes after #299
from this same bean, reaching the same two diagnoses independently — partial
coverage across six push sites, and the `gh-pages-deploy` / `gh-pages-push`
name collision.

#300 is the better artifact on one count that decides it: **it adds a
`check-workflows` gate enforcing the group**, so the collision cannot recur.
This bean's implementation had no such check. It also carries evidence this
one lacked — PR #297 lost a staging push on 2026-09-18 with
`cannot lock ref 'refs/heads/gh-pages'`, so the race had already recurred.
The two picked opposite group names, which is a coin flip; enforcement broke
the tie.

Scrapped rather than deleted, and rather than silently dropped with its
commit, because of the one place the two disagree — which is still open.

## The open disagreement, recorded so it is not re-derived

`discoverability-docs.yml` runs `rust-api`, `python-api` and `schema-docs`
**in parallel with no `needs:`**, all three pushing to `gh-pages`.

- **#300** puts all three in the shared group.
- **This bean** deliberately kept them out and gave each a one-shot retry.

The reasoning for keeping them out: GitHub cancels a *pending* job when a newer
one queues for the same group. Three jobs entering at once gives `rust-api`
running, `python-api` pending, and `schema-docs` cancelling `python-api` — a
lost publish every run. That is worse than the race it replaces, because a
cancelled job reads as intentional while a rejected push is red.

Retry was safe *specifically* there because the three write to different
directories, so a rebase-and-push loses nothing. That is not true in general.

**Unverified, and that is why it is a note and not a finding.** GitHub's
documentation is unreachable from this environment, so the cancellation rule is
training knowledge rather than a measurement — the same limitation #300's own
commit message records about group composition. Raised on
<https://github.com/litlfred/folio-assistant/pull/300#issuecomment-5737508867>.

**Cheapest way to settle it:** watch one `discoverability-docs` run and check
whether all three jobs complete. If one is cancelled, they need the retry
instead of the group.

_2026-09-19T00:30:18Z_ — SETTLED 2026-09-19 by OBSERVATION, which is what this bean said was missing ('GitHub's documentation is unreachable from this environment, so the cancellation rule is training knowledge rather than a measurement'). Three feature-staging runs from THREE DIFFERENT branches inside 17 seconds: 00:27:04 claude/fix-stale-kg-sidecar CANCELLED, 00:27:09 claude/festive-galileo-s7ibx0 CANCELLED, 00:27:21 claude/wonderful-bohr-6kxh7b ran. Different branches, so the per-branch staging-<branch> group cannot explain it; the shared job-level gh-pages-push group is the only thing they had in common. Two staging previews silently lost. So this bean was right and #300 was wrong, and the scope is WIDER than either of us framed it: the defect is not specific to discoverability-docs' three parallel jobs, it hits feature-staging.stage itself whenever more than two PRs are active — the routine case here. eoix accepted the queue on the belief that a queued job waits ('Here we queue'); it does not, a third arrival cancels the pending second, and cancel-in-progress: false governs the RUNNING job rather than the pending one. PR #309 now removes the shared group from stage and cleanup as well; both already carried the mechanism that works (stage a two-step action retry, cleanup a three-attempt rebase loop), so the group was redundant AND harmful. Safe for the same reason as discoverability-docs: each branch writes its own STAGING/<slug>/ with keep_files: true. NOT changed, and worth someone's eye: docs-site publishes ./_site with NO keep_files, which reads as replacing the whole gh-pages root including every STAGING/ directory. Unverified — I did not chase it.
