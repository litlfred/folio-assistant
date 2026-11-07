<!-- kg:subgraph:begin -->
# Findings from an Experiment on Flow Direction of Business Process Models

referenced source — recorded, text withheld by licence

Held in the library [`cat-harness/library/`](../../README.md) as `figl-strembeck-2015-flow-direction-experiment`.

| | |
|---|---|
| document id | `figl-strembeck-2015-flow-direction-experiment` |
| source file | `figl-strembeck-2015-flow-direction-experiment.pdf` (sha256 `5d691c8bf747…`) |
| provenance | ingested |

| holds | count |
|---|---|
| [sections](sections/) | 0 |
| [blocks](blocks/) | 0 |
| images | 0 |

<!-- kg:subgraph:end -->
## Provenance & Ingestion Route (Bean `folio-assistant-e0jh`)

| Field | Value |
|---|---|
| **Citation** | Figl, K., & Strembeck, M. (2015). *Findings from an Experiment on Flow Direction of Business Process Models*. In *Enterprise Modelling and Information Systems Architectures (EMISA 2015)*, GI-Edition Lecture Notes in Informatics (LNI) P-248, pp. 59–73. |
| **URL Fetched** | `https://nm.wu-wien.ac.at/nm/strembeck/publications/emisa15.pdf` (15-page camera-ready PDF hosted by co-author M. Strembeck at WU Wien) |
| **Fetch Date** | `2026-10-31` |
| **SHA-256** | `5d691c8bf74777550a8b8735eb2c191a9bc6bc393ebde9035fb797023c6c003f` |
| **Licence** | `LicenseRef-GI-LNI-Copyright` (Copyright 2015 Gesellschaft für Informatik e.V.) |
| **Ingestion Route** | **Notes only (`referenced.json`)** — full text withheld under publisher copyright |

## Study Design & Empirical Measurements

- **Experimental Design ($N = 44$, Section 6, pp. 6–9 / LNI P-248 pp. 64–67):**
  - **$4 	imes 2$ Between-Subjects Design:** **4 main flow directions** (**Left-to-Right [LR], Right-to-Left [RL], Top-to-Bottom [TB], Bottom-to-Top [BT]**) $	imes$ **2 activity label types** (**Abstract single-letter labels** vs. **Concrete textual domain labels**; 4–6 participants per cell; Table 1, p. 8).
  - **Participants & Task:** **$N = 44$ Information Systems students** (22 abstract labels, 22 concrete labels; mean age 25.9 years, 55% male) answered **8 control-flow comprehension questions** on **2 BPMN process models** (an e-mail voting process and an emergency attendance process, each containing **20 activities and 10 routing gateways**, Fig. 1 p. 7).
  - **What Was Measured:**
    1. *Comprehension accuracy* (percentage of correct answers out of 16 tasks; Fig. 2, p. 10),
    2. *Completion time* (minutes:seconds; Table 2, p. 9),
    3. *Perceived ease of comprehension* (7-point Likert scale; Table 2, p. 9), controlling for prior **process modeling knowledge** (0–4 test score) via ANCOVA.
- **Quantitative Results & Numeric Values Stated (Section 7, Table 2 pp. 9–10, Fig. 2 p. 10 / LNI P-248 pp. 67–68):**
  - **Comprehension Accuracy by Flow Direction (Fig. 2, p. 10):**
    - **Left-to-Right (LR):** **92%** overall (**97%** abstract labels, **88%** concrete labels) — **highest accuracy**
    - **Bottom-to-Top (BT):** **86%** overall (**86%** abstract, **86%** concrete)
    - **Top-to-Bottom (TB):** **84%** overall (**86%** abstract, **81%** concrete)
    - **Right-to-Left (RL):** **79%** overall (**77%** abstract, **80%** concrete) — **lowest accuracy** (13 percentage-point penalty vs. Left-to-Right)
  - **ANCOVA Significance & Statistical Power Threshold (Table 2, pp. 9–10):**
    - At the pilot sample size of $N = 44$, the main effect of flow direction did not reach $lpha = 0.05$ significance for accuracy ($F(3,36) = 1.77, p = 0.17, \eta_p^2 = 0.13$), completion time ($F(3,29) = 2.18, p = 0.11, \eta_p^2 = 0.18$), or perceived ease ($F(3,37) = 1.66, p = 0.19, \eta_p^2 = 0.12$).
    - **Required Sample Size Threshold (Section 6, p. 6):** G\*Power power analysis for a medium effect size ($f(U) > 0.25, lpha = 0.05, 1-eta = 0.80$) requires **$N = 270$ participants**.
    - **Significant Covariate & Label Effects (Table 2, p. 9):** Prior **process modeling knowledge** strongly increased comprehension accuracy ($F(1,36) = 27.64, p = 0.000, \eta_p^2 = 0.43$), and **concrete domain text labels** increased completion time by over 1.5 minutes compared to single-letter labels (**mean 5:36 vs. 4:02**, $F(1,29) = 6.39, p = 0.02, \eta_p^2 = 0.18$).
  - **Layout Anti-Pattern ("Zigzag Models", Section 8, p. 12):** Notes that in practice modelers frequently create **"zigzag models"** (bending or alternating flow directions across rows/columns to avoid scrolling or fit a page format) and backward right-to-left arcs in loops.
