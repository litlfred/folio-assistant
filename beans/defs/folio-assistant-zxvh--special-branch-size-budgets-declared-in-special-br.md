---
# folio-assistant-zxvh
title: 'Special-branch size budgets: declared in special-branches.json, checked by bun run health'
status: in-progress
type: task
created_at: 2026-10-04T06:49:43Z
updated_at: 2026-10-04T06:49:43Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-04: "also update healthchecks for limits on the other specal branches (e.g. lean cache 4gb, auto-docs 1gb, beans 100mb, todos 100mb)"; lean cache = whole family; auto-docs = cat/cat-harness/auto-docs/* each <= 1gb (bean 06e3 / #2049 owns the branch and the docs-auto -> auto-docs rename, told 2026-10-04); qa-reports = own branch, 500 MB.

- [x] budget field on special-branches.json rows (qa-reports, lake-cache, beans, todos) + auto-docs family row
- [x] probe (ls-remote + depth-1 fetch into private refs, tip tree size) and special-branch-size check; absent/unbudgeted counted, never read as within budget
- [x] tests
- [ ] health report regenerated from the current producer
- [ ] qa-reports: legacy `qa-reports` branch still on the remote beside cat/cat-harness/qa-reports — the rename is the owner's (bean oycs)
