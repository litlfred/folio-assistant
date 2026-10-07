---
# folio-assistant-6xdf
title: 'PUBLIC COMMENT: a PR body that merely MENTIONS a change-set id re-links an already-incorporated change-set to it, and the record writer drops $schema'
status: todo
type: bug
priority: high
created_at: 2026-10-06T14:36:04Z
updated_at: 2026-10-06T14:55:46Z
parent: folio-assistant-q4jm
---

Measured 2026-10-06 on litlfred/smart-ra#24 (a submodule-pin staging PR whose body named CS-236 and CS-237 in prose). The public-comment workflow (pull_request_target, platform pinned at 7a2ff7e) committed 5f4ce41 to smart-ra main: both change-sets' pr moved from #9 (the merged PR that made the change) to #24, history gained 'PR #24 is making the change', and both files LOST their "$schema": "changeset/1.0.0" line.

Two defects:
1. Linking: onPullRequest (folio-assistant-core/scripts/public-comment-changesets.ts) links any PR whose body contains a CS-nnn id, even in prose, and even when the change-set is already incorporated with a different merged PR. A settled change-set must not be re-linked; prose mentions should not count (require a keyword such as 'Closes CS-236' or 'cs: CS-236').
2. Writer: the save path drops $schema from the change-set record.

## Done when
- [ ] an incorporated change-set is never re-linked to another PR (test)
- [ ] only an explicit keyword links a PR to a change-set (test), and the public-comment skill says which
- [ ] the record writer keeps $schema (test)
- [x] smart-ra's CS-236 / CS-237 records restored (d4331c3)


_2026-10-06T15:00Z_ — smart-ra CS-236 / CS-237 restored on main by d4331c3 (revert of 5f4ce41), on the owner's instruction.
