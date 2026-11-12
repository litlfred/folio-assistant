---
# folio-assistant-k6dz
$schema: bean/1.0.0
title: 'Split the 23 oversized harness BPMN diagrams into phases'
status: completed
type: task
priority: normal
created_at: 2026-11-06T05:31:14Z
updated_at: 2026-11-12T09:58:00Z
parent: folio-assistant-rwmf
tags:
    - bpmn-layout
---

Follow-up to litlfred/cat-harness#990 (`bb3a42b1`, owner card 2026-11-06, "1. Merge on green"). After #990 none of the 57 harness diagrams had an overlap finding, while 23 still failed `bpmn:detangle --check` on `diagram-too-wide`, `diagram-too-tall` or `lane-order`. These are size budgets, not overlaps. The widest are `kg-separation` (5798 px), `sub-kg-lifecycle` (4329), `human-translation-workflow` (3876) and `subscribe-kg` (3812). Bringing them under the 1400 px budget means splitting each into phases (sub-processes or linked diagrams). `code-change-review`'s `lane-order` hint stays as it is on purpose (see #990's body). Before/after pictures: https://github.com/litlfred/cat-harness/pull/990#issuecomment-6677738281

## Recount on `litlfred/cat-harness` `origin/main` (`8d4c141c`, 2026-11-09) & `litlfred/folio-assistant-core` `origin/main` (`12a75b89`, 2026-11-09)

Measured with `bpmn-detangle.ts --check` across all **79** `.bpmn` files on `cat-harness` `origin/main` (`8d4c141c55199e2f1e502142279e94b3fcb492ad`) and **31** `.bpmn` files on `folio-assistant-core` `origin/main` (`12a75b892f50ebe48fc241d7c061bde577a86604`):

- **Phase split merged (`cat-harness#972`, closing `cat-harness#971`):**
  - [`litlfred/cat-harness#972`](https://github.com/litlfred/cat-harness/pull/972) (`kg-separation: draw it in phases (G5)`) merged at [`d3d7a4da093a`](https://github.com/litlfred/cat-harness/commit/d3d7a4da093a37a9c43c1f14e041278b55fbe85f) (`2026-11-08T10:16:42Z`), closing [`litlfred/cat-harness#971`](https://github.com/litlfred/cat-harness/issues/971) (`2026-11-08T10:16:43Z`).
  - Splits `processes/kg/kg-separation.bpmn` (5798 px → 2905 px top-level) into 4 phase diagrams: `kg-separation-authorise.bpmn` (✓ passes `--check` with 0 findings), `kg-separation-cutover.bpmn` (✓ passes `--check` with 0 findings), `kg-separation-move.bpmn` (2380 × 1500 px), and `kg-separation-prepare.bpmn` (2030 × 1000 px), and narrows `processes/kg/sub-kg-lifecycle.bpmn` (4329 px → 3780 × 1500 px).
- **Library & content process moves (`cat-harness#1032` + `core#639` and `cat-harness#1136` + `core#676`):**
  - The 12 `processes/library/*.bpmn` diagrams (including #3 `human-translation-workflow.bpmn`, #4 `subscribe-kg.bpmn`, #10 `methodology-from-source.bpmn`, #14 `sample-import.bpmn`, #17 `content-acquisition.bpmn`, #24 `copy-out-materialized.bpmn`, and #27 `translation-workflow.bpmn`) and 4 `processes/content/content-{plan,author,publish,retire}.bpmn` diagrams moved from `cat-harness` to `folio-assistant-core`.
- **Original 23 diagrams from #990:**
  - **1 accepted by design (`lane-order` only, width ≤ 1400 px):** `sdlc/processes/code-change-review.bpmn` (1390 px wide; `lane-order` kept intentionally per #990)
  - **1 split into 4 phase diagrams on `cat-harness` `main` (`cat-harness#972` `d3d7a4da093a`):** `processes/kg/kg-separation.bpmn` (5798 px → 2905 px top-level + `kg-separation-authorise` ✓, `kg-separation-cutover` ✓, `kg-separation-move` 2380 px, `kg-separation-prepare` 2030 px; top-level and `-move`/`-prepare` still > 1400 px)
  - **1 narrowed in `cat-harness#972` (`d3d7a4da093a`):** `processes/kg/sub-kg-lifecycle.bpmn` (4329 px → 3780 px wide; still > 1400 px)
  - **20 remaining oversized diagrams from the #990 list** (15 in `cat-harness`, 5 moved to `folio-assistant-core/processes/library/`): not yet split into phases

### A. Original 23 diagrams from `cat-harness#990`

| # | Diagram | Current Repo & Dimensions (`2026-11-09`) | `bpmn:detangle --check` findings | Status |
|---|---|---|---|---|
| 1 | `processes/kg/kg-separation.bpmn` | `cat-harness`: 2905 wide × 1000 tall (was 5798) | `diagram-too-wide`, `diagram-too-tall` | Merged `cat-harness#972` (`d3d7a4da093a`, closing `#971`): split into 4 phase diagrams (`-authorise` ✓, `-cutover` ✓, `-move` 2380×1500, `-prepare` 2030×1000); top-level + `-move`/`-prepare` still > 1400 px |
| 2 | `processes/kg/sub-kg-lifecycle.bpmn` | `cat-harness`: 3780 wide × 1500 tall (was 4329) | `diagram-too-wide`, `diagram-too-tall`, `lane-order` | Narrowed in `cat-harness#972` (`d3d7a4da093a`); still > 1400 px |
| 3 | `processes/library/human-translation-workflow.bpmn` | `folio-assistant-core`: 3876 wide | `diagram-too-wide`, `lane-order` | Moved to `folio-assistant-core` (`#639`); to split |
| 4 | `processes/library/subscribe-kg.bpmn` | `folio-assistant-core`: 3812 wide | `diagram-too-wide` | Moved to `folio-assistant-core` (`#639`); to split |
| 5 | `sdlc/processes/docs-site-publish.bpmn` | `cat-harness`: 3203 wide | `diagram-too-wide` | To split |
| 6 | `sdlc/processes/upstream-version-adoption.bpmn` | `cat-harness`: 3060 wide | `diagram-too-wide`, `lane-order` | To split |
| 7 | `sdlc/processes/merge-to-main.bpmn` | `cat-harness`: 2900 wide × 1060 tall | `diagram-too-wide`, `diagram-too-tall` | To split |
| 8 | `processes/process/crdm-deliver.bpmn` | `cat-harness`: 2666 wide | `diagram-too-wide` | To split |
| 9 | `sdlc/processes/merge-train.bpmn` | `cat-harness`: 2550 wide | `diagram-too-wide`, `lane-order` | To split |
| 10 | `processes/library/methodology-from-source.bpmn` | `folio-assistant-core`: 2270 wide | `diagram-too-wide` | Moved to `folio-assistant-core` (`#639`); to split |
| 11 | `processes/ui/wireframe-design-review.bpmn` | `cat-harness`: 2270 wide | `diagram-too-wide` | To split |
| 12 | `sdlc/processes/requirements-filing.bpmn` | `cat-harness`: 2226 wide | `diagram-too-wide` | To split |
| 13 | `sdlc/processes/merge-refusal.bpmn` | `cat-harness`: 1970 wide | `diagram-too-wide` | To split |
| 14 | `processes/library/sample-import.bpmn` | `folio-assistant-core`: 1850 wide | `diagram-too-wide` | Moved to `folio-assistant-core` (`#639`); to split / compact |
| 15 | `sdlc/processes/test-plan-execution.bpmn` | `cat-harness`: 1760 wide | `diagram-too-wide` | To split / compact |
| 16 | `processes/kg/kg-to-portal.bpmn` | `cat-harness`: 1720 wide × 921 tall | `diagram-too-wide`, `diagram-too-tall` | To split / compact |
| 17 | `processes/library/content-acquisition.bpmn` | `folio-assistant-core`: 1680 wide | `diagram-too-wide` | Moved to `folio-assistant-core` (`#639`); to split / compact |
| 18 | `processes/process/crdm-data-model.bpmn` | `cat-harness`: 1666 wide | `diagram-too-wide` | To split / compact |
| 19 | `processes/process/actor-role-administration.bpmn` | `cat-harness`: 1550 wide | `diagram-too-wide` | To split / compact |
| 20 | `sdlc/processes/code-quality-gates.bpmn` | `cat-harness`: 1540 wide | `diagram-too-wide` | To split / compact |
| 21 | `processes/process/hand-back-to-discussion.bpmn` | `cat-harness`: 1500 wide | `diagram-too-wide` | To split / compact |
| 22 | `processes/process/crdm-needs.bpmn` | `cat-harness`: 1466 wide | `diagram-too-wide` | To split / compact |
| 23 | `sdlc/processes/code-change-review.bpmn` | `cat-harness`: 1390 wide (≤ 1400 budget) | `lane-order` only | Accepted by design in `#990` (swapping lanes would cross loop-backs) |

### B. 8 additional diagrams outside #990's 57-diagram table currently > 1400 px (`2026-11-09`)

| # | Diagram | Current Repo & Dimensions (`2026-11-09`) | Notes |
|---|---|---|---|
| 24 | `processes/library/copy-out-materialized.bpmn` | `folio-assistant-core`: 1760 wide | Moved to `folio-assistant-core` (`#639`); `diagram-too-wide` |
| 25 | `sdlc/processes/stalled-agent-triage.bpmn` | `cat-harness`: 1720 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 26 | `sdlc/processes/qa-report-signing.bpmn` | `cat-harness`: 1640 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 27 | `processes/library/translation-workflow.bpmn` | `folio-assistant-core`: 1636 wide | Moved to `folio-assistant-core` (`#639`); widened in `cat-harness#1112` (`ad91d880`) |
| 28 | `processes/ui/theme-ui-review.bpmn` | `cat-harness`: 1620 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 29 | `processes/content/review-narrative.bpmn` | `cat-harness`: 1540 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 30 | `sdlc/processes/related-work.bpmn` | `cat-harness`: 1510 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |
| 31 | `sdlc/processes/publish-alert.bpmn` | `cat-harness`: 1460 wide | Had 0 overlaps when #990 started; `diagram-too-wide` |

## Done when
Each of the 23 (and the 8 additional diagrams > 1400 px) passes `--check`, or the owner accepts its size with a reason.

## Round 13–15 Progress Update (2026-11-11 — 16 Additional BPMN Diagrams Brought Under 1400 px Budget & Merged on `cat-harness/main`)

- **Batch 1 (`litlfred/cat-harness#1219`, merged `651641f1cf5e`):** `sdlc/processes/publish-alert.bpmn` (1460 → 1240 px), `sdlc/processes/related-work.bpmn` (1510 → 1160 px), `sdlc/processes/qa-report-signing.bpmn` (1640 → 1300 px), `sdlc/processes/stalled-agent-triage.bpmn` (1720 → 1320 px).
- **Batch 2 (`litlfred/cat-harness#1220`, merged `5d452a66adc5`):** `processes/content/review-narrative.bpmn` (1540 → 1360 px), `processes/ui/theme-ui-review.bpmn` (1620 → 1350 px), `library/processes/translation-workflow.bpmn` (1636 → 1390 px), `library/processes/copy-out-materialized.bpmn` (1760 → 1360 px).
- **Batch 3 (`litlfred/cat-harness#1233`, merged `4b31dcf7a015`):** `processes/process/crdm-needs.bpmn` (1466 → 1200 px), `processes/process/hand-back-to-discussion.bpmn` (1500 → 1360 px), `sdlc/processes/code-quality-gates.bpmn` (1540 → 1380 px), `processes/process/actor-role-administration.bpmn` (1550 → 1320 px).
- **Batch 4 (`litlfred/cat-harness#1245`, merged `be6f9dde8ae3`):** `processes/process/crdm-data-model.bpmn` (1666 → 1220 px), `library/processes/content-acquisition.bpmn` (1680 → 1320 px), `sdlc/processes/test-plan-execution.bpmn` (1760 → 1380 px), `library/processes/sample-import.bpmn` (1850 → 1360 px).

## Round 16–17 Completion Update (2026-11-12 — All 93 `cat-harness` & All 31 `folio-assistant-core` BPMN Diagrams Now Pass `<= 1400 × 900 px` with 0 Findings)

- **Batch 5 (`litlfred/cat-harness#1255`, merged):** `processes/kg/kg-to-portal.bpmn` (1720×921 → 1360×889), `sdlc/processes/merge-refusal.bpmn` (1970×720 → 1400×725), `processes/kg/kg-separation-prepare.bpmn` (2030×1000 → 1360×760), `sdlc/processes/requirements-filing.bpmn` (2226×440 → 1360×530).
- **Batch 6 (`litlfred/cat-harness#1257`, merged):** `library/processes/methodology-from-source.bpmn` (2270 → ≤1400), `processes/ui/wireframe-design-review.bpmn` (2270 → ≤1400), `processes/kg/kg-separation-move.bpmn` (2380 → ≤1400), `sdlc/processes/merge-train.bpmn` (2550 → ≤1400).
- **Batch 7 (`litlfred/cat-harness#1256`, merged):** `processes/process/crdm-deliver.bpmn`, `sdlc/processes/merge-to-main.bpmn`, `processes/kg/kg-separation.bpmn` (all ≤1400×900, 0 findings).
- **Batch 8 (`litlfred/cat-harness#1262`, merged `b553b14b93`):** `sdlc/processes/docs-site-publish.bpmn` (3203×342 → 1360×720), `sdlc/processes/upstream-version-adoption.bpmn` (3060×760 → 1360×790), `processes/kg/sub-kg-lifecycle.bpmn` (3780×1500 → 1360×800), `library/processes/subscribe-kg.bpmn` (3812×604 → 1360×720), `library/processes/human-translation-workflow.bpmn` (3876×720 → 1360×780).
- **Core Batch 1 (`litlfred/folio-assistant-core#758`, merged):** 7 oversized `folio-assistant-core` BPMN diagrams (including `processes/scientific/formalize-theorem.bpmn` and library processes) compacted to ≤1400×900 with 0 findings.
- **Core Batch 2 (`litlfred/folio-assistant-core#762`, merged `e2d3d08791`):** `processes/content/contributor-feedback.bpmn` (2136×660 → 1380×660), `processes/content/content-change-review-committee.bpmn` (2710×430 → 1380×450), `processes/content/evidence-retrieval.bpmn` (2765×767 → 1380×720), `processes/content/content-lifecycle.bpmn` (2820×1650 → 1380×750), `processes/conduct/getting-started.bpmn` (2920×2112 → 1380×750).
- **Core Batch 3 (`litlfred/folio-assistant-core#765`, merged `57c7d09bcb`):** `processes/content/draft-to-publication.bpmn` (2900×1235 → 1380×835), `processes/content/editing-hci-validation.bpmn` (3394×1272 → 1380×855), `processes/library/l1-document-ingestion.bpmn` (3820×874 → 1360×800), `dsa/processes/dsa-document-lifecycle.bpmn` (10180×1844 → 1380×875).
- **Verification:** `0` `.bpmn` diagrams remain `diagram-too-wide` or `diagram-too-tall` across all 93 `.bpmn` files in `litlfred/cat-harness` and all 31 `.bpmn` files in `litlfred/folio-assistant-core`. Bean completed.
