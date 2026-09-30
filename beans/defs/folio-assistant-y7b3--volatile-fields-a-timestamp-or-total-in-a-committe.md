---
# folio-assistant-y7b3
title: 'VOLATILE FIELDS: a timestamp or total in a committed generated file turns every pair of concurrent changes into a conflict'
status: in-progress
type: task
created_at: 2026-09-30T22:25:16Z
updated_at: 2026-09-30T22:25:16Z
parent: folio-assistant-o3xy
---

Follow-on to #1658 (bean 52cz, done) and beans oxka / 520m / lxpq (completed). Owner 2026-09-30 chose MEASURE line-level before building a resolver.

## Measured 2026-09-30

300 recent main-into-branch merges on origin/claude/* replayed with git merge-tree (read-only). 235 conflicted; 147 (63%) conflicted ONLY on generated files.

Top four, what the conflicting lines are:

| file | conflicted merges | conflicting content |
|---|---|---|
| skill-register.qa-results.json | 89 | updated_at on 80 of 86 hunk lines; script_hash 6 |
| glossary/index.md (-merge) | 87 | real new DefinedTerms + header and TOTAL-count lines |
| beans/README.md | 76 | only the '| defs/ | N files |' count line |
| audit-coverage.qa-results.json (-merge) | 60 | updated_at every time, count-bearing summaries, some real gate-list changes |

Across 150 merges / 1174 conflicted files, hunks compared with digits, hashes and timestamps masked:
- 508 (43%) differ ONLY in a number, hash or timestamp
- 270 real content
- 396 whole-file (-merge files: no hunks to inspect)

Only 33 of 150 merges would have been fully clean without volatile fields: the -merge files and real content remain.

## Mechanism

writeQaResult already refuses to restamp unchanged findings (ymsu). The collision is when BOTH branches change findings: each writes a new updated_at, and that single line collides while the rest of the body merges cleanly. A total count behaves the same. Checks already strip updated_at before comparing (subgraph-readmes:158, root-scan-census:242, check-reference-direction:917, audit-coverage:527), so it carries no verdict.

## Done when
- [x] line-level measurement recorded
- [ ] owner decides which fix, if any
