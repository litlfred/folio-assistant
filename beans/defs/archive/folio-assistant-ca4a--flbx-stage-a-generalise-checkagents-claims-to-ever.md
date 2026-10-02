---
# folio-assistant-ca4a
title: 'flbx stage A: generalise check:agents-claims to every declared prose/code pair'
status: completed
type: task
priority: normal
created_at: 2026-09-23T10:38:11Z
updated_at: 2026-09-23T12:19:15Z
parent: folio-assistant-flbx
---

Issue #1042, R3. After stage B. Location + absence shapes, plus resolvable claims (CLI flag, exit code, workflow job / if: step). Unparsed claims counted, never passed.

## Done when
- [x] stage B merged (#1065)
- [x] claim shapes extended and run over each declared pair kind
- [x] not-parsed count reported per run; tests pin each shape

## Summary of Changes

PR #1072, merged 2026-09-23 on the owner's "merge both when green". kg-qa
criterion `prose-claims-resolve` over the 32 declared pairs, three
outcomes (holds / false / undetermined), `bun run pairs:claims` for the
full count. 24 hold, 0 false, 10 undetermined; the one real false claim
(test-engineer.md → schemas/test-types.ts) fixed in the same PR. Stage B's
flag on code-quality-gates was re-read and attested during the merges.
