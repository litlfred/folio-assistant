---
# folio-assistant-xd1s
title: 'Complete the gh-pages-push concurrency group: five workflows and a name collision'
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T23:39:43Z
updated_at: 2026-09-19T00:35:50Z
---


_2026-09-18T23:39:52Z_ — Follows sibling bean eoix, which gave feature-staging's stage and cleanup jobs the gh-pages-push group and deliberately deferred the rest ('touches five CI files neither bean measured'). Two findings completing it. (1) Partial coverage: a group serialises only the jobs that NAME it, so docs-site, discoverability-docs (three jobs), blueprint, lean_ci and publish were still free to race — PR #297 lost a staging push to exactly that on 2026-09-18. (2) A name collision, which is the harder one: blueprint and lean_ci ALREADY carried a job-level group for this reason, called gh-pages-deploy. A group matches on the literal string, so those two queued against each other and nobody else — indistinguishable in effect from no group, while reading in the file like a solved problem. All nine push sites now name gh-pages-push, and check-workflows gains a gh-pages-ungrouped finding that catches both modes (verified by reintroducing each). Measured: only docs-site (144 runs) and feature-staging (234) have ever run here; blueprint, discoverability-docs and lean_ci never have, publish once in June.

_2026-09-19T00:35:50Z_ — Verified complete, 2026-09-19 on main at 1a94703. All seven gh-pages-touching workflows that push now carry 'group: gh-pages-push' (blueprint, discoverability-docs, docs-site, feature-staging, lean_ci, publish); the gh-pages-deploy collision is gone, surviving only as explanatory comments in lean_ci.yml:472 and blueprint.yml:240. scripts/check-workflows.ts carries the gh-pages-ungrouped finding kind and workflow-yaml.test.ts asserts it stays empty. Ran check-workflows over 36 workflows: clean, including 'every gh-pages push is in the gh-pages-push group'. Also checked deploy-folio.yml, the one remaining file matching a gh-pages grep — it only MENTIONS gh-pages in a comment about publish.yml and pushes nothing, so it is not a tenth site and its lack of a group is correct. NOT closing it — not my bean to resolve.
