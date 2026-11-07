<!-- kg:subgraph:begin -->
# Seven Process Modeling Guidelines (7PMG)

referenced source — recorded, text withheld by licence

Held in the library [`cat-harness/library/`](../../README.md) as `mendling-2010-7pmg`.

| | |
|---|---|
| document id | `mendling-2010-7pmg` |
| source file | `mendling-2010-7pmg.pdf` (sha256 `2b7f9e2dea49…`) |
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
| **Citation** | Mendling, J., Reijers, H. A., & van der Aalst, W. M. P. (2010). *Seven Process Modeling Guidelines (7PMG)*. *Information and Software Technology*, 52(2), 127–136 (`doi:10.1016/j.infsof.2009.08.004`). |
| **URL Fetched** | `https://www.vdaalst.com/publications/p574.pdf` (30-page preprint/manuscript hosted by co-author W. M. P. van der Aalst) |
| **Fetch Date** | `2026-10-31` |
| **SHA-256** | `2b7f9e2dea4931c43e3b86d7dc9367e0396e1885e937beb8ee45d23362d04cc6` |
| **Licence** | `LicenseRef-Elsevier-Copyright` (Copyright 2009 Elsevier B.V.; all rights reserved) |
| **Ingestion Route** | **Notes only (`referenced.json`)** — full text withheld under publisher copyright |

## Study Design & Empirical Measurements

- **Empirical Foundation Synthesized (Section 2, pp. 5–10):**
  - Synthesizes structural error-prediction studies on **600+ SAP Reference Model EPCs** and **2,000+ industrial EPC process models** (Mendling 2008; Mendling et al. 2007, 2008), comprehension experiments on concurrency, loops, and modularity, and activity-labeling experiments with **$N = 29$ graduate students** at Eindhoven University of Technology (Mendling, Reijers & Recker 2010).
- **Delphic Practitioner Prioritization Study ($N = 21$, Section 4, pp. 18–22):**
  - Conducted a structured ranking workshop with **$N = 21$ experienced Austrian process-modeling practitioners** (average 4.8 years of experience) who ranked the 7 guidelines across two rounds (with feedback of empirical backing between rounds).
  - **Final Practitioner Priority Ranking (Table 2, p. 20):**
    1. **G6** (*Use verb-object activity labels*) — Rank 1 (mean rank 2.45)
    2. **G7** (*Decompose a model with more than 50 elements*) — Rank 2 (mean rank 3.20)
    3. **G3** (*Use one start and one end event*) — Rank 3 (mean rank 3.85)
    4. **G4** (*Model as structured as possible*) — Rank 4 (mean rank 3.90)
    5. **G1** (*Use as few elements in the model as possible*) — Rank 5 (mean rank 4.35)
    6. **G2** (*Minimize the routing paths per element*) — Rank 6 (mean rank 4.80)
    7. **G5** (*Avoid OR routing elements*) — Rank 7 (mean rank 5.45)
- **The Seven Process Modeling Guidelines & Numeric Thresholds Stated (Section 3, pp. 10–18; Table 1, p. 12 / IST p. 131):**
  - **G1:** *Use as few elements in the model as possible* (qualitative in 7PMG; refined to **$\le 31$ nodes** in Mendling et al. 2012, Table 6 p. 12).
  - **G2:** *Minimize the routing paths per element* (qualitative in 7PMG; refined to **degree $\le 3$** in Mendling et al. 2012, Table 6 p. 12).
  - **G3:** *Use one start and one end event* (**$= 1$ start event and $= 1$ end event**; refined to **$\le 2$ start and end events** for error probability in Mendling et al. 2012, Table 6 p. 12).
  - **G4:** *Model as structured as possible* (every split connector matched by a corresponding join connector of the same type; refined to **structuredness $\ge 0.79$** and **connector mismatch $\le 4.5$** in Mendling et al. 2012).
  - **G5:** *Avoid OR routing elements* (**$0$ OR-splits/OR-joins**; use AND or XOR instead).
  - **G6:** *Use verb-object activity labels* (e.g., *"Verify invoice"* rather than *"Invoice verification"* or *"Invoice"*).
  - **G7 (Explicit Numeric Threshold in 7PMG):** *"Decompose a model with more than **50 elements**"* — because for models with **$> 50$ elements** the probability of containing a soundness/control-flow error exceeds **50%** (Section 3.3, p. 11; Table 1, p. 12 / IST p. 131). *(Note: The **31-node** decomposition threshold comes from the follow-up ROC study **Mendling, Sánchez-González, García & La Rosa 2012**, Table 3/4 p. 9 & Table 6 p. 12, which explicitly refines G1 and G7 from 50 elements down to **31 nodes**.)*
