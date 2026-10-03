---
# folio-assistant-4vg7
title: 'WORK PLAN: two bean files declare the same id folio-assistant-t3n8 — every id-keyed reader sees one and silently loses the other'
status: todo
type: bug
created_at: 2026-10-03T12:05:24Z
updated_at: 2026-10-03T12:05:24Z
parent: folio-assistant-whlc
---

Found 2026-10-03 by the q8ar SQLite slice builder (its manifest lists t3n8 under duplicateIds). Files: `folio-assistant-t3n8--harness-display-names-every-instance-declares-a-hu.md` (parent yj32) and `folio-assistant-t3n8--the-archive-rung-stages-but-can-never-promote-and.md` (parent ahvw). Any reader keyed by id (beans CLI, claim-bean, the dashboard index, roadmap) resolves one and drops the other, and a commit or issue citing `t3n8` is ambiguous.

## Done when
- [ ] one of the two gets a fresh id via the beans CLI (never delete either; the owner of each decides which keeps t3n8 if they are cited — check git log / issues / other beans for `t3n8` references first)
- [ ] every reference to the renamed one is updated
- [ ] a gate fails on a duplicate bean id (check whether an existing check:* should already catch it, and why it did not)
