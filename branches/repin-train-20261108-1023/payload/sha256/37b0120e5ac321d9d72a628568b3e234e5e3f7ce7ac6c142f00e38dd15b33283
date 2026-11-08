---
# folio-assistant-k6dz
$schema: bean/1.0.0
title: 'Split the 23 oversized harness BPMN diagrams into phases'
status: in-progress
type: task
priority: normal
created_at: 2026-11-06T05:31:14Z
updated_at: 2026-11-08T08:41:00Z
parent: folio-assistant-rwmf
tags:
    - bpmn-layout
---

Follow-up to litlfred/cat-harness#990 (`bb3a42b1`, owner card 2026-11-06, "1. Merge on green"). After #990 none of the 57 harness diagrams had an overlap finding, while 23 still failed `bpmn:detangle --check` on `diagram-too-wide`, `diagram-too-tall` or `lane-order`. These are size budgets, not overlaps. The widest are `kg-separation` (5798 px), `sub-kg-lifecycle` (4329), `human-translation-workflow` (3876) and `subscribe-kg` (3812). Bringing them under the 1400 px budget means splitting each into phases (sub-processes or linked diagrams). `code-change-review`'s `lane-order` hint stays as it is on purpose (see #990's body). Before/after pictures: https://github.com/litlfred/cat-harness/pull/990#issuecomment-6677738281

## Recount on `litlfred/cat-harness` `origin/main` (`42d4f156`, 2026-11-08)

Measured with `bun run cat bpmn:detangle processes sdlc/processes --check` across all **87** `.bpmn` files on `origin/main` (`42d4f1560bc5b99ab20b473cdadb1d9fbe2e24d8`):

- **Overlap findings across all 87 diagrams:** **0**
- **Passing `--check` with 0 findings:** **56 / 87** (including `processes/kg/graph-detanglement.bpmn` redrawn 2840 → 1390 px in `04a81b02` / #990 `bb3a42b1`, and `processes/process/crdm-requirements.bpmn` at 1142 px calling its 7 `crdm-*` phase diagrams)
- **Original 23 diagrams from #990:**
  - **1 accepted by design (`lane-order` only, width ≤ 1400 px):** `sdlc/processes/code-change-review.bpmn` (1390 px wide; `lane-order` kept intentionally per #990)
  - **1 split into 4 phase diagrams in open draft PR `litlfred/cat-harness#972` (`e48baab1`):** `processes/kg/kg-separation.bpmn` (5798 px → 2905 px top-level + `kg-separation-prepare`, `-authorise`, `-move`, `-cutover`; closes `cat-harness#971`)
  - **1 awaiting owner card `Q-B1-3` (`cat-harness#971`):** `processes/kg/sub-kg-lifecycle.bpmn` (4329 px wide)
  - **20 remaining oversized diagrams from the #990 list:** not yet split into phases on `origin/main`

### A. Original 23 diagrams from `cat-harness#990`

| # | Diagram | Dimensions on `origin/main` (`42d4f156`) | `bpmn:detangle --check` findings | Status |
|---|---|---|---|---|
| 1 | `processes/kg/kg-separation.bpmn` | 5798 wide | `diagram-too-wide`, `lane-order` | Open draft PR `cat-harness#972` (`e48baab1`) splits into 4 phase diagrams (`-prepare`, `-authorise`, `-move`, `-cutover`, top-level 2905 wide) |
| 2 | `processes/kg/sub-kg-lifecycle.bpmn` | 4329 wide | `diagram-too-wide` | Tracked under `cat-harness#971`; waits on owner card `Q-B1-3` |
| 3 | `processes/library/human-translation-workflow.bpmn` | 3876 wide | `diagram-too-wide`, `lane-order` | To split |
| 4 | `processes/library/subscribe-kg.bpmn` | 3812 wide | `diagram-too-wide` | To split |
| 5 | `sdlc/processes/docs-site-publish.bpmn` | 3203 wide | `diagram-too-wide` | To split |
| 6 | `sdlc/processes/upstream-version-adoption.bpmn` | 3060 wide | `diagram-too-wide`, `lane-order` | To split |
| 7 | `sdlc/processes/merge-to-main.bpmn` | 2900 wide × 1060 tall | `diagram-too-wide`, `diagram-too-tall` | To split |
| 8 | `processes/process/crdm-deliver.bpmn` | 2666 wide | `diagram-too-wide` | To split |
| 9 | `sdlc/processes/merge-train.bpmn` | 2550 wide | `diagram-too-wide`, `lane-order` | To split |
| 10 | `processes/library/methodology-from-source.bpmn` | 2270 wide | `diagram-too-wide` | To split |
| 11 | `processes/ui/wireframe-design-review.bpmn` | 2270 wide | `diagram-too-wide` | To split |
| 12 | `sdlc/processes/requirements-filing.bpmn` | 2226 wide | `diagram-too-wide` | To split |
| 13 | `sdlc/processes/merge-refusal.bpmn` | 1970 wide | `diagram-too-wide` | To split |
| 14 | `processes/library/sample-import.bpmn` | 1850 wide | `diagram-too-wide` | To split / compact |
| 15 | `sdlc/processes/test-plan-execution.bpmn` | 1760 wide | `diagram-too-wide` | To split / compact |
| 16 | `processes/kg/kg-to-portal.bpmn` | 1720 wide × 921 tall | `diagram-too-wide`, `diagram-too-tall` | To split / compact |
| 17 | `processes/library/content-acquisition.bpmn` | 1680 wide | `diagram-too-wide` | To split / compact |
| 18 | `processes/process/crdm-data-model.bpmn` | 1666 wide | `diagram-too-wide` | To split / compact |
| 19 | `processes/process/actor-role-administration.bpmn` | 1550 wide | `diagram-too-wide` | To split / compact |
| 20 | `sdlc/processes/code-quality-gates.bpmn` | 1540 wide | `diagram-too-wide` | To split / compact |
| 21 | `processes/process/hand-back-to-discussion.bpmn` | 1500 wide | `diagram-too-wide` | To split / compact |
| 22 | `processes/process/crdm-needs.bpmn` | 1466 wide | `diagram-too-wide` | To split / compact |
| 23 | `sdlc/processes/code-change-review.bpmn` | 1390 wide (≤ 1400 budget) | `lane-order` only | Accepted by design in `#990` (swapping lanes would cross loop-backs) |

### B. 8 additional diagrams outside #990's 57-diagram table currently > 1400 px on `origin/main` (`42d4f156`)

| # | Diagram | Dimensions on `origin/main` (`42d4f156`) | Notes |
|---|---|---|---|
| 24 | `processes/library/copy-out-materialized.bpmn` | 1760 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 25 | `sdlc/processes/stalled-agent-triage.bpmn` | 1720 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 26 | `sdlc/processes/qa-report-signing.bpmn` | 1640 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 27 | `processes/library/translation-workflow.bpmn` | 1636 wide | Was 1380 wide in #990; widened in `cat-harness#1112` (`ad91d880`) |
| 28 | `processes/ui/theme-ui-review.bpmn` | 1620 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 29 | `processes/content/review-narrative.bpmn` | 1540 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 30 | `sdlc/processes/related-work.bpmn` | 1510 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 31 | `sdlc/processes/publish-alert.bpmn` | 1460 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |

## Done when
Each of the 23 (and the 8 additional diagrams > 1400 px) passes `--check`, or the owner accepts its size with a reason.
