---
# folio-assistant-xd1s
title: 'Complete the gh-pages-push concurrency group: five workflows and a name collision'
status: completed
type: task
priority: normal
created_at: 2026-09-18T23:39:43Z
updated_at: 2026-09-20T14:37:12Z
parent: folio-assistant-1xhc
---


_2026-09-18T23:39:52Z_ — Follows sibling bean eoix, which gave feature-staging's stage and cleanup jobs the gh-pages-push group and deliberately deferred the rest ('touches five CI files neither bean measured'). Two findings completing it. (1) Partial coverage: a group serialises only the jobs that NAME it, so docs-site, discoverability-docs (three jobs), blueprint, lean_ci and publish were still free to race — PR #297 lost a staging push to exactly that on 2026-09-18. (2) A name collision, which is the harder one: blueprint and lean_ci ALREADY carried a job-level group for this reason, called gh-pages-deploy. A group matches on the literal string, so those two queued against each other and nobody else — indistinguishable in effect from no group, while reading in the file like a solved problem. All nine push sites now name gh-pages-push, and check-workflows gains a gh-pages-ungrouped finding that catches both modes (verified by reintroducing each). Measured: only docs-site (144 runs) and feature-staging (234) have ever run here; blueprint, discoverability-docs and lean_ci never have, publish once in June.

_2026-09-19T00:32:19Z_ — Measured on the queue as shipped, 2026-09-19T00:27Z — the pending-cancellation mode `pdxk` predicted is firing routinely ACROSS branches, not only in the three-job `discoverability-docs` case it was written about. Four staging runs inside 100 seconds, all contending for `gh-pages-push`: 35409314016 (ecstatic-goldberg, #311, 00:25:41) held the group and succeeded; 35409394720 (fix-stale-kg-sidecar, #312, 00:27:04) was CANCELLED at 00:27:11; 35409399384 (festive-galileo, #304, 00:27:09) was CANCELLED at 00:27:23; 35409410865 (wonderful-bohr, 00:27:21) succeeded. Each cancellation is the arrival of the next run — #312's pending job dropped when #304 queued, #304's when wonderful-bohr queued. GitHub cancels the pending member of a concurrency group whenever a newer one arrives, and `cancel-in-progress: false` does not change that: it governs the RUNNING job only. The queue therefore has depth ONE, and the comment at feature-staging.yml:66 ("Here we queue") holds only for a single waiter. Why this reads worse than the race it replaced: a lost push was a RED `stage` with `! [rejected]` in the log, whereas a dropped pending job is `cancelled`, which renders as neither pass nor fail — so a PR's staging silently does not exist and the check run says nothing about why. Two PRs were in that state at once here, and #304 could not tell from its own check run whether the previous `stage` FAILURE had been fixed; it took a manual re-run to find out. That is "could not determine, rendered as something else", on a check surface. Not proposing the fix from here — the retry-vs-queue choice is this bean's and `pdxk` already weighed it. Recording only that the accepted cost is being paid several times an hour at the current number of live `claude/*` branches.

_2026-09-19T00:35:50Z_ — Verified complete, 2026-09-19 on main at 1a94703. All seven gh-pages-touching workflows that push now carry 'group: gh-pages-push' (blueprint, discoverability-docs, docs-site, feature-staging, lean_ci, publish); the gh-pages-deploy collision is gone, surviving only as explanatory comments in lean_ci.yml:472 and blueprint.yml:240. scripts/check-workflows.ts carries the gh-pages-ungrouped finding kind and workflow-yaml.test.ts asserts it stays empty. Ran check-workflows over 36 workflows: clean, including 'every gh-pages push is in the gh-pages-push group'. Also checked deploy-folio.yml, the one remaining file matching a gh-pages grep — it only MENTIONS gh-pages in a comment about publish.yml and pushes nothing, so it is not a tenth site and its lack of a group is correct. NOT closing it — not my bean to resolve.


## 2026-09-20 — closed on the GATE, not on the count (`0pes`)

**And the note above is wrong where it counts.** It says *"all seven
gh-pages-touching workflows"* and then names six. Measured today: **four** files
carry `group: gh-pages-push` — `lean_ci.yml`, `docs-site.yml`, `publish.yml`,
`blueprint.yml`.

That is not a regression, and finding it is why the discharge rule in
`bean-coordination` says re-derive rather than quote. The invariant this bean
exists for is upheld by *group **or** retry*, and `bun run check:workflows` is
what asserts it:

> ✓ all parse; no duplicate keys; no attacker-controlled expression in a run
> body; **every gh-pages push is protected by the `gh-pages-push` queue or a
> retry**; no full-replace publish drops the open PRs' `STAGING/` previews

Closed on that gate — a check anyone can re-run — rather than on a number in
prose that was already stale.
