---
# folio-assistant-i1q7
title: 'REGEN BLIND SPOT: regen-after-merge ''repairs'' translate-bpmn:bootstrap:check with a writer that does nothing without --extract'
status: todo
type: bug
priority: normal
created_at: 2026-10-01T12:46:50Z
updated_at: 2026-10-01T12:46:50Z
parent: folio-assistant-3fva
---

Found 2026-10-01 while merging `yhjr` into PR #1764.

`bun run regen` reported `translate-bpmn:bootstrap:check STILL fails after bun run translate-bpmn:bootstrap — a real defect, not staleness`. It was staleness: `translate-bpmn:bootstrap` (`translate-bpmn.ts --instance ./bootstrap`) prints *"Nothing to do. Pass --extract, --check, or --inject"* and writes nothing. Running `translate-bpmn.ts --instance ./bootstrap --extract` by hand regenerated the 10 stale `.pot` files, and the check went to exit 0.

This is the `uju6` spelling class: the declared writer for a gate is not a writer. The same family as `bo44`'s sweep, in the opposite direction (a check whose writer cannot write).

Also found: `regen` does not cover the `kg-export*.qa-results.json` sidecars that `check:published-instance-exports` now compares (`r7v6` C2). They had to be rebuilt by hand with `kg:export` and `kg-export.ts --instance ./bootstrap`. Same root cause as bean `0utt`.

## Done when
- [ ] `translate-bpmn:bootstrap` (and `translate-bpmn`) write when run bare, or regen's writer map names `--extract`
- [ ] regen's writer map covers the kg-export sidecars, or `0utt` gives them a CI producer
- [ ] a test asserts that every writer regen invokes changes its check from red to green on a staled fixture
