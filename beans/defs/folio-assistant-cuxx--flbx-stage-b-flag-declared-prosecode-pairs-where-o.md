---
# folio-assistant-cuxx
title: 'flbx stage B: flag declared prose/code pairs where one side changed and the other did not'
status: in-progress
type: task
created_at: 2026-09-23T10:38:11Z
updated_at: 2026-09-23T10:38:11Z
parent: folio-assistant-flbx
---

Issue #1042, R1 R2 R6 R7. Declared pairs only: <folio:implements workflow> (+ <folio:job>) on BPMN, co-located skill .md/.ts, block .md/lean.ref. Hash each side; a one-sided change since the pair was last reviewed is a minor, advisory finding ('prose not re-reviewed'), recorded as a sidecar in an existing QA family. Asserts nothing about truth, so it cannot cry wolf.

## Done when
- [x] pair discovery from existing declarations, with the count of pairs found and of kinds not scanned
- [x] per-pair hash baseline and a re-review mark, in an existing QA sidecar family
- [x] criterion reported by kg:audit (minor, not gated), with tests
- [ ] bun run gates green; PR opened
