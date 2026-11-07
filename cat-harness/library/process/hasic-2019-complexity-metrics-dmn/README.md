<!-- kg:subgraph:begin -->
# Complexity metrics for DMN decision models

referenced source — recorded, text withheld by licence

Held in the library [`cat-harness/library/`](../../README.md) as `hasic-2019-complexity-metrics-dmn`.

| | |
|---|---|
| document id | `hasic-2019-complexity-metrics-dmn` |
| source file | `hasic-2019-complexity-metrics-dmn.pdf` (sha256 `40f5912e8c9c…`) |
| provenance | ingested |

| holds | count |
|---|---|
| [sections](sections/) | 0 |
| [blocks](blocks/) | 0 |
| images | 0 |

<!-- kg:subgraph:end -->

## Structured Research Notes (Bean `folio-assistant-e0jh`)

- **Citation:** Hasić, F. & Vanthienen, J. (2019). *Complexity metrics for DMN decision models.* Computer Standards & Interfaces, 65, 15–37.
- **DOI:** `10.1016/j.csi.2019.01.006`
- **URL Fetched:** `https://lirias.kuleuven.be/retrieve/449c1dc4-7d30-40da-913d-7ffa926cc2d7`
- **Copy Used:** Author accepted manuscript (KU Leuven Lirias repository, 54 pages including Appendices A–C)
- **Fetch Date:** `2026-10-31`
- **SHA-256:** `40f5912e8c9c2137d6795567cffc2a83751fb55c30f79081718e8782fd723784`
- **Licence & Ingestion Route:** `LicenseRef-Elsevier-Copyright` (Elsevier copyright — Notes-only `referenced.json` rung)
- **Study Design:** Proposes **19 Decision Requirements Diagram (DRD) metrics** (Section 3, pp. 8–18, Table 1 p. 17) and **7 Decision Table (decision logic level) metrics** (Section 4, pp. 18–22, Table 2 p. 22), and evaluates them empirically with **$n = 113$ master's students** solving comprehension tasks and rating perceived complexity (`0–10` scale) across **11 DRD models** and **11 DMN Decision Tables** (Section 6, pp. 26–33, Table 7 p. 31, Table 8 p. 32).
- **What Was Measured:** Pearson correlation and Sum of Squared Differences (SSD) between all 26 complexity metrics (19 DRD + 7 Decision Table) and empirical perceived complexity ratings across the 11 DRDs and 11 Decision Tables, plus the full $26 \times 26$ metric correlation matrix (Table C.9, p. 52).
- **Numeric Thresholds & Key Findings (Answers Bean DMN Question on Paper 19):**
  - **Does Paper 19 state thresholds such as `"inputs <= 5"` or `"NOBE <= 25"`?** **No — Gemini fabricated those thresholds.** Paper 19 states **zero** cutoff thresholds for `TNIV` (inputs) or `NOBE`:
    - For **`TNIV` (Total Number of Input Variables, Section 4.6, p. 21):** the paper states only qualitatively, *"It is good practice to prevent this number from growing too large. In the running example in Figure 2, 4 input variables are found..."* Across the 11 tested decision tables (**Table 8, p. 32**), `TNIV` ranges from `1` to `6`.
    - For **`NOBE` (Number of Basic Elements = `#decisions + #inputs + #informationRequirements`, Section 3.1.3, p. 9):** across the 11 tested DRDs (**Table 7, p. 31**), `NOBE` ranges from `8` to `43` (`9, 8, 13, 20, 29, 20, 43, 21, 20, 29, 40`) and exhibits almost zero correlation with perceived complexity ($r = 0.01, \text{SSD} = 122.56$).
  - **Best Empirically Validated DRD Metrics (Table 7, p. 31 & Section 8, p. 34):**
    - **Durfee Square Metric (`DSM`):** $d$ where the DRD has $d$ decisions of degree $\ge d$ ($r = 0.35$, lowest $\text{SSD} = 90.71$, Section 3.2.1 p. 11, Table 7 p. 31).
    - **Perfect Square Metric (`PSM`):** $p$ where the $p$-th highest-degree decision has degree $\ge p^2$ (highest correlation $r = 0.55$, $\text{SSD} = 115.72$, Section 3.2.2 p. 12, Table 7 p. 31).
    - **Total Number of Data Objects (`TNDO`):** $\text{SSD} = 92.49$; **Number of Complex Decisions (`NCD`):** $\text{SSD} = 96.80$ (Table 7, p. 31).
  - **Best Empirically Validated Decision Table Metrics (Table 8, p. 32 & Section 8, p. 34):**
    - **Hit Policy Usage (`HPU`):** strongest decision-table complexity predictor (**$r = 0.77$, lowest $\text{SSD} = 29.26$**, Table 8 p. 32), using hit-policy complexity weights (`U = 0.1`, `A = 0.3`, `F = P = 0.4`, `C< = C> = 0.7`, `C+ = C# = 0.8`, Section 4.4 p. 20).
    - **Total Number of Input Variables (`TNIV`):** second strongest decision-table predictor (**$r = 0.59$, $\text{SSD} = 48.00$**, Table 8 p. 32).
  - **DRD vs. Decision Table Trade-Off (Section 7, p. 33 & Table C.9, p. 52):** `Density` (DRD) and `TNIV` (Decision Table) correlate negatively (**$r = -0.62$**): decomposing one large decision table into smaller tables reduces individual table `TNIV` but increases DRD size and interconnections.
