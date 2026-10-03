---
# folio-assistant-8wj1
title: 'QA READERS F4: block and translation read-modify-write writers stop dropping agent verdicts when the prior is absent — the block-qa D2 split'
status: todo
type: task
priority: critical
created_at: 2026-10-01T08:47:13Z
updated_at: 2026-10-01T08:47:13Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, from reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, §5.2 family F4). Refines `oqe3` (`translation:block-qa:check`) and `2ae2` (`qa-agent-write`). Blocked on `16ei`.

**CRITICAL (C11), and it must land before `5hox`.** Each writer below READS the prior verdict file to keep the entries it does not own, including the 13 agent verdicts (11 block-qa and 2 translation-qa, in 12 files). With the prior absent, it writes back a report holding only its own entries, and nothing reports the loss.

## Readers
- `cat-harness/content/pipeline/qa-utils.ts:975,1097` (`loadQaReport`, block discovery) (B). Unknown.
- `content/pipeline/qa-sweep.ts:415-416`, plus `sameScriptVerdict` at `:580,:632,:664,:720` (B). **LOSS.**
- `content/pipeline/qa-merge-findings.ts:186-211` (B). **LOSS.**
- `content/pipeline/integration-audit.ts:222-228` (B). **LOSS.**
- `content/pipeline/language-trap-audit.ts:346,558-559` (B). **LOSS.**
- `content/pipeline/q-usage-audit.ts:292-293,453` (B). **LOSS.**
- `content/pipeline/proof-narrative-lean-equiv-sweep.ts:515-530` (B). **LOSS.**
- `content/pipeline/qa-agent-entry.ts:78-79` (D). **LOSS.**
- `content/pipeline/translation-block-qa.ts:831-856`: `--check` is loud (35 stale, measured); the write path through `mergeCriteria` is **LOSS** (A/B).
- `content/pipeline/qa-staleness.ts:131-136` (MCP `qa_staleness`) (D). Correct unknown: `[NO-QA]`, measured.
- MCP `qa_sweep` (`folio-assistant-core/adapters/document/tools/qa.ts:39-54`) → `qa-sweep.ts` (D). **LOSS.**
- `content/pipeline/qa-agent-drain-queue.ts:89`, `semantic-cone.ts:193`, `proof-axis-dashboard.ts:128` (D/C). Unknown.
- `cat-harness/src/qa-agent-write.ts:163,181,225` (D) reads and writes the LEGACY beside-block `${base}.qa.json`, not `test/results/block-qa/`. The live-defects bean records that.

## Migration action
1. **D2 split of mixed files.** The 13 agent entries move to `test/attestations/` on main. Script entries go to the branch.
2. Every read-modify-write reads the script half from `qa-store` and the attestation half from `test/attestations/`. A miss on either is `unknown`, and **never a blank prior**.
3. An agent verdict (`qa-agent-entry`, `qa-agent-write`) is written to `test/attestations/` only.
4. `qa-paths.ts` keeps the path functions. `qa-witness.ts` (publish family) consumes them and does not edit them.

## Done when
- [ ] a sweep over a tree with no `test/results/` and no fetch refuses or reports `unknown`; it does not write a report missing the 13 agent entries
- [ ] the 13 agent entries are byte-identical in `test/attestations/` (checked by a test)
- [ ] `translation:block-qa:check` and the MCP `qa_staleness` and `qa_sweep` give the same results with `test/results/` absent and the branch fetched
