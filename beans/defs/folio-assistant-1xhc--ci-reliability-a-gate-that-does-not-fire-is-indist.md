---
# folio-assistant-1xhc
title: 'CI RELIABILITY: a gate that does not fire is indistinguishable from one that passed'
status: in-progress
type: epic
created_at: 2026-09-19T11:43:44Z
updated_at: 2026-09-19T11:43:44Z
---

A gate that does not fire is indistinguishable from one that passed.

That is `xom7`'s lesson one layer up, and every item here is an instance:
`3pqn` (a PR that opens with zero checks looks exactly like one whose checks
are green), `dzl3` (playwright fails before any test body runs), `t373`
(`readme:audit` is in no workflow at all, and `main` carried eight dead links),
`bgle` (a guard that enumerates with `git ls-files` cannot see a new file),
`v8gh` (nothing checks `AGENTS.md`'s own links).

`xd1s`, `w2g5` and `lx2s` are the staging and concurrency machinery those gates
run inside. Fixing any one without the others leaves the same class of silence
somewhere else.
