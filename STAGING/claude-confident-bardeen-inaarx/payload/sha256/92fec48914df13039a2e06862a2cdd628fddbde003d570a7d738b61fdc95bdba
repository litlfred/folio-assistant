---
# folio-assistant-zxvh
title: 'Special-branch size budgets: declared in special-branches.json, checked by bun run health'
status: completed
type: task
priority: normal
created_at: 2026-10-04T06:49:43Z
updated_at: 2026-10-04T17:26:07Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-04: "also update healthchecks for limits on the other specal branches (e.g. lean cache 4gb, auto-docs 1gb, beans 100mb, todos 100mb)"; lean cache = whole family; auto-docs = cat/cat-harness/auto-docs/* each <= 1gb (bean 06e3 / #2049 owns the branch and the docs-auto -> auto-docs rename, told 2026-10-04); qa-reports = own branch, 500 MB.

- [x] budget field on special-branches.json rows (qa-reports, lake-cache, beans, todos) + auto-docs family row
- [x] probe (ls-remote + depth-1 fetch into private refs, tip tree size) and special-branch-size check; absent/unbudgeted counted, never read as within budget
- [x] tests
- [x] health report regenerated from the current producer. Re-run 2026-10-04 by session_01BccmnVFbtRpKxM39kyVw9q on this branch's merged head: `special-branch-size` is determined, and finds `cat/cat-harness/qa-reports` at 3.50 GB against its 500 MB budget
- [x] qa-reports: legacy `qa-reports` branch still on the remote beside cat/cat-harness/qa-reports — the rename is the owner's (bean oycs). Resolved outside this PR: on 2026-10-04 `git ls-remote --heads origin` lists only `cat/cat-harness/qa-reports`

## Summary of Changes

Each special branch now declares a `budget`: qa-reports 500 MB, the lake-cache family 4 GiB, beans and todos 100 MiB, and each auto-docs branch 1 GiB. A `special-branch-size` check and its probe report against them, counting absent and unbudgeted branches rather than reading them as within budget. Health re-run on 2026-10-04: `cat/cat-harness/qa-reports` is **3.50 GB against 500 MB**, a real finding for the owner. Lands with PR #2055.
