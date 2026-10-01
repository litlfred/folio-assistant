---
# folio-assistant-2gst
title: 'QA READERS F1: kg-audit reads its carried state (pair attestations, voice reviews, test runs) from qa-store — two false-cleans, and the kg-qa D2 split'
status: todo
type: task
priority: critical
created_at: 2026-10-01T08:47:12Z
updated_at: 2026-10-01T08:47:12Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, from reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, §5.1 family F1). Refines `oqe3` 3.1a. Blocked on the qa-store bean `16ei`.

**Holds two of the audit's CRITICAL rows.** It must land before `5hox`: deleting the kg-qa tree before this lands destroys the attestations without a word.

## Readers
- `cat-harness/scripts/kg-audit.ts:2751`: `--check` staleness over every `kg-qa/**` (A). Absent today: loud, 488 stale.
- `kg-audit.ts:2620-2623`: `kg-qa.manifest.json`, own or hosted (A). Absent today: loud.
- `cat-harness/scripts/kg-audit-all.ts`: R01 run per instance, 17 instances (A). Absent today: loud.
- **C4** `kg-audit.ts:2721` → `cat-harness/scripts/prose-code-pairs.ts:147-149,173-181` (`evaluatePairs`, `readAttestations`): `pair_attestations` (B). **Absent today: FALSE-CLEAN + LOSS.** `prose-reviewed-since-code-changed` goes 13 → 0 under `--check`; the write path re-baselines and drops the 6 agent attestations. Measured.
- `kg-audit.ts:2738` → `cat-harness/scripts/skill-voice-review.ts:131-139` (`readVoiceReviews`): `voice_reviews` (B). None are committed today. It has the same `[]`-on-missing shape.
- **C5** `kg-audit.ts:1716` → `cat-harness/scripts/test-run-conformance.ts:77`: `crdm-detect-eval.test-run.json` (B). **Absent today: FALSE n/a.** Three criteria go from `pass` to `n/a` through `entry(findings, any=false)` (`kg-audit.ts:286-289`).
- `kg-audit.ts:2671,2780` `sweepOrphans` / `relocateSidecars` (`schemas/kg-qa.ts:272`) (B). Absent today: quiet, 0 orphans.
- `cat-harness/scripts/eval-crdm-detect.ts:141,171`: the prior test run (B, a writer that reads its prior). Absent today: handled.

## Migration action
1. **D2 split.** Move `pair_attestations` (32 entries in 32 files: 6 `by: agent`, 26 `by: baseline`) and any `voice_reviews` out of the mixed `kg-qa/v1` files into `test/attestations/`, which stays on main. The owner has not ruled whether the 26 baselines count as attestations. The audit recommends that they do, because a regenerated baseline forgets the drift it recorded.
2. `readAttestations`, `readVoiceReviews` and the test-run read go through `qa-store`. A miss or a corrupt read is `unknown`. It is never a re-baseline and never `n/a`.
3. `--check` becomes compute-and-judge with `--against qa-reports:main/<merge-base>`. The manifest and the orphan sweep are judged against the fetched tree.

## Done when
- [ ] the attestations live in `test/attestations/`, and `kg:audit` on a tree with no `test/results/` still reports the 13 `prose-reviewed-since-code-changed` findings it reports today
- [ ] with `test/results/` absent and no fetch, the test-run criteria read `unknown`, not `n/a`
- [ ] `kg:audit:check` and `kg:audit:all:check` pass on `main` with `test/results/` absent from the checkout
- [ ] a seeded new finding fails a PR, and an inherited one is reported but does not fail
