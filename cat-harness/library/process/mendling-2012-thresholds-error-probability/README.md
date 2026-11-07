<!-- kg:subgraph:begin -->
# Thresholds for error probability measures of business process models

referenced source — recorded, text withheld by licence

Held in the library [`cat-harness/library/`](../../README.md) as `mendling-2012-thresholds-error-probability`.

| | |
|---|---|
| document id | `mendling-2012-thresholds-error-probability` |
| source file | `mendling-2012-thresholds-error-probability.pdf` (sha256 `66597e6ef735…`) |
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
| **Citation** | Mendling, J., Sánchez-González, L., García, F., & La Rosa, M. (2012). *Thresholds for error probability measures of business process models*. *Journal of Systems and Software*, 85(5), 1188–1197 (`doi:10.1016/j.jss.2012.01.017`). |
| **URL Fetched** | `https://web.archive.org/web/20200728172909id_/https://epub.wu.ac.at/5912/1/thresholds_revised2.pdf` (WU Wien ePubWU 5912 manuscript PDF via Wayback Machine) |
| **Fetch Date** | `2026-10-31` |
| **SHA-256** | `66597e6ef73549c367c62b8fd7ed16e54b1b118d4be5db75d66b64cc556d3d6f` |
| **Licence** | `LicenseRef-Elsevier-Copyright` (Copyright 2012 Elsevier Inc.; all rights reserved) |
| **Ingestion Route** | **Notes only (`referenced.json`)** — full text withheld under publisher copyright |

## Study Design & Empirical Measurements

- **Method & Industrial Corpora (Sections 3–4, PDF pp. 5–11 / JSS pp. 1190–1195):**
  - **Calibration Corpus ($N = 2,003$ EPC models):** Four real-world EPC collections (SAP Reference Model, two consulting datasets, German service provider; mean **20.7 nodes**, **211 models with formal soundness errors = 10.5%**; Section 4.1, PDF p. 6 / JSS p. 1191).
  - **Cross-Validation Corpus ($N = 429$ EPC models):** Independent industrial corpus from an Australian insurance company (mean **27.1 nodes**, **20 models with formal soundness errors = 4.66%**; Section 4.4, PDF p. 8 / JSS p. 1193).
  - **Statistical Technique:** Receiver Operating Characteristic (**ROC**) curves, Area Under the Curve (**AUC**), and **Bender's (1999) Value of an Acceptable Risk Level (VARL)** logistic-regression threshold identification across **17 structural complexity metrics** (Table 1 PDF p. 4, Tables 3–5 PDF pp. 9–10 / JSS pp. 1193–1194).
- **Answer to Bean Open Question 1 ("Where does 'warn at 31 nodes' come from?"):**
  - The **31-node threshold** originates in **this paper (Mendling, Sánchez-González, García & La Rosa 2012)**, **NOT** in 7PMG (Mendling, Reijers & van der Aalst 2010, which used 50 elements):
    1. **Table 3 & Table 4 (PDF p. 9 / JSS p. 1193):** The ROC threshold for `nodes` ($|N|$) is **`31.5`** ($	ext{AUC} = 0.841, 	ext{SE} = 0.015, p = 0.015$), where VARL error probability is **9%** below 31.5 nodes and climbs steeply toward 100% above 31.5 nodes (Fig. 3, PDF p. 11 / JSS p. 1195).
    2. **Section 5.1 (PDF p. 11 / JSS p. 1195) & Table 6: Ten Process Modeling Rules (PDF p. 12 / JSS p. 1195):** Explicitly refines 7PMG Guidelines G1 and G7:
       - **Rule G1 (`Nodes`):** *"Do not use more than **31**."*
       - **Rule G7 (`Nodes`):** *"Decompose a model with more than **31 nodes**."* (*"Guideline G7 can be refined based on the threshold found for nodes: a model should already be decomposed once it has more than 31 nodes."*, PDF p. 11 / JSS p. 1195).

## Complete Table of ROC & VARL Numeric Thresholds (Tables 3, 4 & 6, PDF pp. 9, 12 / JSS pp. 1193, 1195)

| Metric | Discriminating Threshold | Direction of Safe Zone | ROC AUC | VARL Error Prob. at Threshold | Refined 7PMG Rule (Table 6, p. 12) |
|---|---|---|---|---|---|
| **`nodes`** ($|N|$) | **`31.5`** (Rule: **$\le 31$**) | $\le 31$ | `0.841` | `9%` | **G1:** Do not use $> 31$ nodes; **G7:** Decompose $> 31$ nodes |
| **`av. conn. degree`** ($\overline{d_C}$) | **`3.09`** (Rule: **$\le 3$**) | $\le 3.09$ | `0.712` | `7%` | **G2:** No more than 3 inputs/outputs per connector |
| **`max. conn. degree`** ($\hat{d}_C$) | **`3.5`** (Rule: **$\le 3$**) | $\le 3$ | `0.790` | `6%` | **G2:** No more than 3 inputs/outputs per connector |
| **`start-events`** ($|E_S|$) | **`2.5`** (Rule: **$\le 2$**) | $\le 2$ | `0.736` | `7%` | **G3:** Use no more than 2 start and end events |
| **`end-events`** ($|E_E|$) | **`2.5`** (Rule: **$\le 2$**) | $\le 2$ | `0.824` | `5%` | **G3:** Use no more than 2 start and end events |
| **`structuredness`** ($\Phi$) | **`0.79`** | $\ge 0.79$ | `0.766` | `9%` | **G4.a:** Model as structured as possible ($\Phi \ge 0.79$; highest precision **23%**, accuracy **$>90\%$**) |
| **`conn. mismatch`** ($MM$) | **`4.5`** (Rule: **$\le 4$**) | $\le 4.5$ | `0.871` | `6%` | **G4.b:** Use balanced AND/XOR splits and joins ($MM \le 4.5$) |
| **`or-splits`** ($|C_{	ext{OR-split}}|$) | **`0.5`** (Rule: **$0$**) | $< 1$ ($0$) | `0.739` | `9%` | **G5.a:** Avoid OR-joins and OR-splits |
| **`or-joins`** ($|C_{	ext{OR-join}}|$) | **`0.5`** (Rule: **$0$**) | $< 1$ ($0$) | `0.567` | — | **G5.a:** Avoid OR-joins and OR-splits |
| **`conn. heterogeneity`** ($CH$) | **`0.4`** | $\le 0.4$ | `0.874` | `8%` | **G5.b:** Do not mix connector types ($CH \le 0.4$; highest AUC overall) |
| **`token splits`** ($TS$) | **`7.5`** (Rule: **$\le 7$**) | $\le 7.5$ | `0.861` | `19%` | **G5.c:** Do not allow more than 7 parallel branches ($TS \le 7.5$) |
| **`cfc`** (Control-Flow Complexity) | **`4.5`** | $\le 4.5$ | `0.861` | `7%` | Control-flow complexity $\le 4.5$ |
| **`density`** ($\Delta$) | **`0.033`** | $\ge 0.033$ | `0.831` | `16%` | Arc density threshold $0.033$ (inversely scaled with size) |
| **`coeff. connectivity`** ($CNC$) | **`1.021`** | $\le 1.021$ | `0.767` | `8%` | Arc-to-node ratio $\le 1.021$ |
| **`sequentiality`** ($\Xi$) | **`0.21`** | $\ge 0.21$ | `0.817` | `12%` | Sequentiality ratio $\ge 0.21$ |
| **`separability`** ($\Pi$) | **`0.49`** | $\ge 0.49$ | `0.753` | `7%` | Cut-vertex separability ratio $\ge 0.49$ |
| **`depth`** ($\Lambda$) | **`0.5`** | $\le 0.5$ | `0.799` | `4%` | Nesting depth $\le 0.5$ |
| **`cyclicity`** ($CYC$) | **`0.005`** | $< 0.005$ ($0$) | `0.621` | `7%` | Cycle node fraction $< 0.005$ |
