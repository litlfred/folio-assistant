---
# folio-assistant-87ln
title: 'QOU QA MOVE: move qou''s 3,653 sibling block-QA verdicts into test/results/block-qa/ (s3p2 option 2)'
status: scrapped
type: task
created_at: 2026-09-23T13:29:00Z
updated_at: 2026-09-23T13:29:00Z
parent: folio-assistant-q4jm
---

Owner ruling 2026-09-23 on s3p2: "1 + 2=bean". Option 1 (fix the sweep's anchor) is done in s3p2. This is option 2.

**What:** move qou's block QA verdicts from the legacy sibling layout (`content/…/<block>.qa.json`, beside each block) into the results tree `test/results/block-qa/content/…/<block>.qa.json`, which `blockQaPath` documents.

**Measured 2026-09-23 (qou `7aafd8dbe`):** 3,653 `*.qa.json`, all siblings under `content/`. None in the results tree.

**Why it is safe to do and safe not to do:**
- `existingBlockQaPath` reads the results tree first and the sibling second, so nothing is lost either way.
- The sweep WRITES only the results tree. So the first sweep after this move finds its verdicts, while without the move a block briefly has a fresh verdict in the tree and an old one beside it. Readers take the tree's.
- Freshness is keyed on content hashes (`source_hashes`, `field_hash`), not on paths, so a move marks nothing stale.

**Why a separate bean:** it is a 3,653-file change in the author's math repository. qou's AGENTS.md requires `/prepare-merge` plus an explicit "merge it" from the author for every merge to main.

## Done when
- [ ] a qou PR moves the files with `git mv`, so history follows
- [ ] a qou sweep afterwards reports the same pass/fail/stale counts as before the move
- [ ] the author says "merge it"

## BLOCKED before any file moved: 42 qou readers look only beside the block (measured 2026-09-23)

In qou `7aafd8dbe`, **42 scripts and tests** outside the content chapters read `*.qa.json`. **None of them** uses the platform's reader (`existingBlockQaPath` / `blockQaReadPaths`), and none mentions `test/results/block-qa`. Each builds the path beside the block, or globs `content/**/*.qa.json`. They include CI-facing gates, for example:
- `scripts/check-sidecars.sh`
- `scripts/qa-evidence-provenance-gate.py`
- `scripts/qa-duplicate-verdict-check.py`
- `content/pipeline/qa-evidence-audit.ts`

**Moving the 3,653 files first would blind all 42 at once.** Each would report "no sidecar" for every block, which reads as "nobody checked" and not as "moved". That is the `dh4f` shape. So nothing was moved, and no qou PR was opened.

Measured list:
- `content/get_fails.py`
- `content/pipeline/trace-convention-audit.ts`
- `content/pipeline/qa-agent-entry.fieldhash.test.ts`
- `content/pipeline/block-manifest-audit.ts`
- `content/pipeline/qa-flag-preservation-audit.ts`
- `content/pipeline/definition-clarity-audit.ts`
- `content/pipeline/lean-vacuity-axiom-audit.ts`
- `content/pipeline/language-trap-audit.ts`
- `content/pipeline/qa-evidence-migrate.test.ts`
- `content/pipeline/circular-anchor-audit.ts`
- `content/pipeline/qa-agent-entry.guard.test.ts`
- `content/pipeline/qa-evidence-audit.test.ts`
- `content/pipeline/arity-conflation-candidates.ts`
- `content/pipeline/qa-evidence-migrate.ts`
- `content/pipeline/witness-substitution-audit.ts`
- `content/pipeline/superseded-block-lean-audit.ts`
- `content/pipeline/qa-evidence-audit.ts`
- `content/pipeline/qa-agent-entry.ts`
- `content/get_failures.py`
- `test_agy.sh`
- `scripts/check-sidecars.sh`
- `scripts/qa-stale-agent-evidence.py`
- `scripts/lean-verify-changed.sh`
- `scripts/count-actionable-placeholders.ts`
- `scripts/reaudit-proof-deterministic.py`
- `scripts/expire-unhashed-agent-verdicts.py`
- `scripts/split_amalgamated.py`
- `scripts/qa-sidecar-agent-union.py`
- `scripts/lean-axiom-guard.py`
- `scripts/qa-evidence-provenance-gate.py`
- `scripts/lean-qa-progress-table.py`
- `scripts/lean-content-sweep.sh`
- `scripts/qa-duplicate-verdict-check.py`
- `scripts/reaudit_verdict.py`
- `scripts/reaudit-da-compile-claims.py`
- `docs/audits/scripts/epistemic_status_crosscheck.py`
- `computations/deltalambda/wlambda_binding_c_frame_conditionality_audit.py`
- `computations/ab_methodology_metrics.py`
- `computations/audits/q0_muon_population_partition.py`
- `computations/canonical_mass_status_guard.py`
- `computations/qbeta/qbeta_ladder_headline_residual_provenance_probe.py`
- `computations/status_label_overclaim_audit.py`

**The order that would work:** first point the 42 readers at one shared lookup that tries the results tree first and the sibling second. Then move the files. That is a qou refactor of its own, in the author's math repository, so it needs the author's call before starting.

## Scrapped — owner ruling 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE)

Owner chose **"1. Leave qou as is"**. qou keeps its 3,653 block-QA verdicts as siblings beside their blocks. That layout is permanently supported: `existingBlockQaPath` reads it, and `publish-block-qa` finds it. Moving the files would blind the 42 qou readers listed above, and pointing those readers somewhere new is a qou refactor nobody asked for. Nothing is broken by leaving it. Reopen only if qou itself wants the results tree.
