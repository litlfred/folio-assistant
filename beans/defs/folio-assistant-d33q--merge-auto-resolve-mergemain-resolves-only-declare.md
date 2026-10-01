---
# folio-assistant-d33q
title: 'MERGE AUTO-RESOLVE: merge:main resolves only DECLARED conflict patterns, proves the result with the gate set, and is the merge-base.bpmn sub-process'
status: in-progress
type: feature
created_at: 2026-10-01T06:57:14Z
updated_at: 2026-10-01T06:57:14Z
parent: folio-assistant-1xhc
---

Issue #1707 (bean y7b3 measured it). Owner 2026-10-01: '1 + new skills/tools for each common churn/conflict pattern' and 'put in merge process bpmn'. Settles 520m's open question (may a resolver cover every generated artefact?) as: yes, one declared pattern at a time.

## Measured (y7b3)
300 main-into-branch merges: 235 conflicted, 147 (63%) only on generated files.

## Built
- cat-harness/scripts/merge-conflict-patterns.ts: ordered registry, each with globs, strategy (take-base / generated-regions / qa-sidecar / refuse) and why. Undeclared paths refuse.
- cat-harness/scripts/merge-base.ts + 'bun run merge:main': classify all first; any refusal aborts and restores the tree; resolve; 'regen' (workflow-derived gate set) must report nothing unrepaired; commit.
- processes/merge-base.bpmn, called from Task_PrepareMerge in code-change-review.bpmn.
- skill merge-conflict-patterns: one section per pattern.

## Done when
- [x] registry + command + tests (refusals tested beside each resolution)
- [x] BPMN sub-process, called from the merge step
- [ ] gates green, PR merged
- [ ] PR B: workflow that runs merge:main on conflicted open PRs when main moves

## Verified 2026-10-01
- Replayed 40 real historical merges (dry-run): 39 agreed with an independent generated-vs-authored classification; the 1 disagreement refused safely (kg-qa.manifest.json, now a declared pattern).
- Full run on real merge 6b8e62d (16 conflicts): all resolved by declared pattern, regen 63 current / 0 unrepaired, merge committed.

## Handover (owner away a week)
- Merged without waiting for CI on the owner's instruction; check CI on the merge commit first.
- Next: PR B, a workflow that runs `bun run merge:main` on conflicted open PRs when main moves (bot push; same diagram).
