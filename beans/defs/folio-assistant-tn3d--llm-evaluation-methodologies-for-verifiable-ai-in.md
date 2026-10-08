---
# folio-assistant-tn3d
title: 'LLM evaluation methodologies for Verifiable AI in SMART guidelines (issue #2513)'
status: completed
type: task
priority: normal
created_at: 2026-10-08T08:38:38Z
updated_at: 2026-10-08T15:21:23Z
parent: folio-assistant-5a3l
---

Review methodologies in arXiv:2606.21008, 2603.27124, 2608.18294, 2403.16873, 2203.02010, 2505.10399 and review smart-* repositories to evaluate applicability to research questions R1-R7 (clinical workflows adherence, L1->L2/L3 authoring, KG value, layered validation, model comparisons).

## Summary of Review

Reviewed methodologies in 6 foundational papers on evaluation without ground truth:
- arXiv:2606.21008 (Nordfors - Metanym Game: SVD council of peers, anchor portfolios)
- arXiv:2608.18294 (Egami & Shin - DMM: debiased inference with multiple imperfect measurements via CP decomposition and unit features)
- arXiv:2403.16873 (Liu & Jha - Cramér-Rao bound for ranking without ground truth / RWT)
- arXiv:2603.27124 (Liu & Jha - Extending RWT with known ground truth anchors)
- arXiv:2203.02010 (Liu et al. - NGSE with correlated noise)
- arXiv:2505.10399 (Rawal et al. - AXE: evaluating explanations and decision logic on-manifold without ground truth)

Mapped to research questions R1 to R7 and WHO SMART Guidelines (smart-base, smart-immunizations, HIV PrEP).
Detailed report generated in artifact directory: llm-evaluation-methodologies-smart-guidelines.md.

## Additional Ingestion & Discrepancy Synthesis (litlfred/qou@0cec8c3)

- Ingested and promoted arXiv:2405.14766v2 (UKHSA public health extraction) and arXiv:2505.06046v4 (UKHSA PubHealthBench) into KG library.
- Integrated recommendation discrepancy taxonomy (Extraneous, Omission, Contradiction/Timing) and the MCQA vs FreeForm performance cliff (>90% MCQA vs <75% FreeForm, 57% Clinical Guidance).
- Mapped discrepancy detection and insulation into L1, L2 (DAK decision tables/BPMN as the structural bridge), L3 computable authoring, and national adaptation processes.
- Connected automated discrepancy gates to folio-assistant-core BPMN workflows (ingest-derive-content, evidence-retrieval, l2-dak-authoring, content-change-review, editing-hci-validation).

## Completed (2026-10-08)
- All 8 foundational papers promoted to cat-harness/library/ (423 JSON-LD nodes).
- All 8 upload source files retired to fsh-guts/uploads/ with folio-fsh-guts/v1 sidecars; check:uploads-retired clean.
- Formal methodology node cat-harness/methodologies/verifiable-ai-guideline-evaluation.md registered and verified with test suite.
- Detailed AXE on-manifold evaluation synthesis and UKHSA discrepancy analysis posted to GitHub issue #2513.
