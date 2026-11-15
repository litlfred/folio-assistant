---
# folio-assistant-c5y7
$schema: bean/1.0.0
title: 'Memory: S9B thread (2026-11-01/02) BPMN guidance PRs for fhir-harness, sci, who-iris, smart-base: all merged; leftover stale sci .pot files'
status: completed
type: task
priority: low
created_at: 2026-11-02T07:12:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `s9b-bpmn-guidance-part-two.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: S9B thread (2026-11-01/02) BPMN guidance PRs for fhir-harness, sci, who-iris, smart-base: all merged; leftover stale sci .pot files


Thread "Merge BPMN guidance PRs, part two" (cmsg_017WNUkNK8kdDziPK58Pv6G9RVAQdJzdBJpU6pZcQSZaL3) is DONE as of 2026-11-02 07:11Z. It was split from folio-assistant-2xsz.

Merged, all on green:
- fhir-harness #263 and #259
- smart-base #265 (Q-S9B-1 A)
- who-iris #156 and #158
- sci #165, #161, #162 and #163
- core#585 and cat-harness#946 (wave-5 .pot regen)
- tools#1377 and cat-harness#952 (slide-6 five lanes)

Leftover: folio-assistant-sci main has stale .pot files for atomic-mass-drift-check and lean-docs-publish. #161 and #162 renamed tasks without regenerating them. It is not gated in sci CI.

Lessons:
- Renaming a test that fails standalone needs the matching rename in cat-harness-tools scripts/standalone-baseline.json. Otherwise the standalone judge reads it as a new failure.
- Draft PRs only run the fast tier, so a full-tier red can surface only after the PR is marked ready (sci#163's workflow-gate test).
- sci#169 (pot path fix, issue #168) merged 07:54Z by meta-merge 2; sci main pots clean. Thread done.
