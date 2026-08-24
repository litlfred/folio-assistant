---
# folio-assistant-zevm
title: 'qa-criterion-hash fixture drifted: bare AUTOMATED_CHECKERS not matched'
status: todo
type: task
priority: normal
created_at: 2026-08-24T17:25:12Z
updated_at: 2026-08-24T17:25:27Z
---

Pre-existing failure, surfaced while running the suite for the pypdf_safe work on branch claude/gracious-dijkstra-0ijp2l. Not caused by that change (its diff touches only PDF scripts and a skill doc).

scripts/tests/qa-criterion-hash.test.ts:110 'resolves criteria in the real voice checker module' fails: criterionSourceHash() returns null for both 'voice-scholarly-default' and 'wall-side-correct' against content/pipeline/qa-checkers-voice.ts. 744 pass / 1 fail.

Both keys DO exist in that module (lines 1167 and 1173), inside the record exported at line 1139. The other tests in the file, which run against a synthetic fixture, pass — so parseFile() works and it is findCriterionEntry() that misses on the real module.

Likely cause, not yet confirmed: qa-criterion-hash.ts documents itself as finding an exported '*_AUTOMATED_CHECKERS' record, but qa-checkers-voice.ts exports a bare 'AUTOMATED_CHECKERS' with no prefix, and that record leads with spreads of the sub-registries. The test's own comment says it exists to guard the fixture shape 'against drifting from how checkers are really written' — so the test is doing its job and the fixture is what drifted.

Consequence while open: every criterion in that module silently falls back to the whole-file hash, so any edit anywhere in a 1200-line file invalidates every criterion's cached QA result.
