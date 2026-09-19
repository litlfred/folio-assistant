---
# folio-assistant-xd1s
title: 'Complete the gh-pages-push concurrency group: five workflows and a name collision'
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T23:39:43Z
updated_at: 2026-09-18T23:39:52Z
---


_2026-09-18T23:39:52Z_ — Follows sibling bean eoix, which gave feature-staging's stage and cleanup jobs the gh-pages-push group and deliberately deferred the rest ('touches five CI files neither bean measured'). Two findings completing it. (1) Partial coverage: a group serialises only the jobs that NAME it, so docs-site, discoverability-docs (three jobs), blueprint, lean_ci and publish were still free to race — PR #297 lost a staging push to exactly that on 2026-09-18. (2) A name collision, which is the harder one: blueprint and lean_ci ALREADY carried a job-level group for this reason, called gh-pages-deploy. A group matches on the literal string, so those two queued against each other and nobody else — indistinguishable in effect from no group, while reading in the file like a solved problem. All nine push sites now name gh-pages-push, and check-workflows gains a gh-pages-ungrouped finding that catches both modes (verified by reintroducing each). Measured: only docs-site (144 runs) and feature-staging (234) have ever run here; blueprint, discoverability-docs and lean_ci never have, publish once in June.
