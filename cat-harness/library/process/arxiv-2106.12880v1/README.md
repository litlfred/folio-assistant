<!-- kg:subgraph:begin -->
# Towards Measuring and Quantifying the Comprehensibility of Process Models — The Process Model Comprehension Framework

ingested source material — attributed to its document, not folio content

Held in the library [`cat-harness/library/`](../../README.md) as `arxiv-2106.12880v1`.

| | |
|---|---|
| document id | `arxiv-2106.12880v1` |
| source file | `2106.12880v1.pdf` (sha256 `ebbd7354915d…`) |
| pages | 16 |
| arXiv | [2106.12880v1](https://arxiv.org/abs/2106.12880v1) |
| provenance | ingested |

| holds | count |
|---|---|
| [sections](sections/) | 32 |
| [blocks](blocks/) | 21 |
| images | 5 |

<!-- kg:subgraph:end -->
## Provenance & Ingestion Route (Bean `folio-assistant-e0jh`)

| Field | Value |
|---|---|
| **Citation** | Winter, M., Pryss, R., Fink, F., & Reichert, M. (2021). *Towards Measuring and Quantifying the Comprehensibility of Process Models — The Process Model Comprehension Framework*. `arXiv:2106.12880v1` (`cs.SE`). |
| **URL Fetched** | `https://arxiv.org/pdf/2106.12880.pdf` (landing page: `https://arxiv.org/abs/2106.12880`) |
| **Fetch Date** | `2026-10-31` |
| **SHA-256** | `ebbd7354915d3b2af5c7050c949324bf233e97c1e6e72b85094270eb9721db12` |
| **Licence** | `CC-BY-NC-SA-4.0` (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International) |
| **Ingestion Route** | **Full text** (`pdf-structure` rung, 16 pages, 16 sections, 5 figures) |

## Study Design & Empirical Measurements

- **Theoretical Framework & ETT Construction:** Combines **Communication Theory** (modeler encoding $	o$ process model medium $	o$ reader decoding under noise; Section 2.1, pp. 3–4, Fig. 2) and the **Conceptual Modeling Quality Framework (CMQF)** (Section 2.2, pp. 4–5, Fig. 3) into the **Process Model Comprehension Framework (PMCF)** (Section 3, pp. 5–6, Fig. 4) and an **Evaluation Theory Tree (ETT)** containing **96 quality metrics** across **8 quality criteria** (Modeling Process, Domain, Model, Language, Representation, Comprehension, Learning, Perception; Section 3.1, pp. 6–8, Fig. 5, Appendix A pp. 14–16).
- **Survey Weighting ($N = 131$):** Metric weights ($w_k$) were derived via **Direct Numerical Logging (DNLog)** from an empirical ranking survey of **$N = 131$ participants** (students, researchers, and domain experts; Abstract p. 1, Section 3.2 p. 8).
- **Case Study ($N = 33$, BPMN 2.0):** Evaluated on **5 BPMN 2.0 process models**, each in 2 variants (**Explicit vs. Implicit**: Model 1 Start Event, Model 2 End Event, Model 3 Loop, Model 4 Parallelism, Model 5 Decomposition), created by **3 modelers** and comprehended by **30 process readers** ($N = 33$ total; Section 4.1, pp. 9–11).
- **What Was Measured:**
  - *Objective comprehension accuracy* on 3 true/false comprehension questions per model (0–3 scale; Table 1, p. 11).
  - *Aggregated PMCF comprehensibility score* $ar{X} = 
rac{\sum_{k=1}^n w_k p_{i,k}}{\sum_{k=1}^n w_k} \in [1, 10]$ (Eq. 1, p. 7), broken down by Modeler Perspective, Reader Perspective, and Combined Total Score (Table 1, p. 11).
- **Key Findings & Numeric Thresholds Stated:**
  - **Normalized PMCF Score Scale:** $[1, 10]$, where **`1` = poorest comprehensibility** and **`10` = best comprehensibility** (Section 3.2, p. 8).
  - **Explicit vs. Implicit BPMN Variant Scores (Table 1, p. 11):**
    - *Model 1 (Start Event — Explicit vs. Implicit):* Comprehension score **2.76 vs. 1.56** (out of 3); Combined PMCF score **7.70 vs. 7.36**.
    - *Model 2 (End Event — Explicit vs. Implicit):* Comprehension score **2.38 vs. 2.00**; Combined PMCF score **7.25 vs. 6.72**.
    - *Model 3 (Loop — Explicit gateway vs. Implicit sequence cycle):* Comprehension score **1.82 vs. 1.06**; Combined PMCF score **6.97 vs. 5.56**.
    - *Model 4 (Parallelism — Explicit AND-gateway vs. Implicit):* Comprehension score **1.94 vs. 1.65**; Combined PMCF score **7.46 vs. 6.53**.
    - *Model 5 (Decomposition — Subprocess vs. Flat):* Comprehension score **2.47 vs. 2.19**; Combined PMCF score **7.94 vs. 6.91**.
