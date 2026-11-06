<!-- kg:subgraph:begin -->
# Activity labeling in process modeling: empirical insights and recommendations

referenced source — recorded, text withheld by licence

Held in the library [`cat-harness/library/`](../../README.md) as `mendling-2010-activity-labeling`.

| | |
|---|---|
| document id | `mendling-2010-activity-labeling` |
| source file | `mendling-2010-activity-labeling.pdf` (sha256 `1b0492ae5299…`) |
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
| **Citation** | Mendling, J., Reijers, H. A., & Recker, J. (2010). *Activity labeling in process modeling: empirical insights and recommendations*. *Information Systems*, 35(4), 467–482 (`doi:10.1016/j.is.2009.03.009`). |
| **URL Fetched** | `https://hreijers.win.tue.nl/H.A.%20Reijers%20Bestanden/IS611_acceptedManuscript.pdf` (55-page accepted manuscript hosted by co-author H. A. Reijers at TU/e) |
| **Fetch Date** | `2026-10-31` |
| **SHA-256** | `1b0492ae5299933ae0fd32f9fa5375d4502b68443d3247775f789704abeb02c6` |
| **Licence** | `LicenseRef-Elsevier-Copyright` (Copyright 2009 Elsevier Ltd.; all rights reserved) |
| **Ingestion Route** | **Notes only (`referenced.json`)** — full text withheld under publisher copyright |

## Study Design & Empirical Measurements

- **Part 1 — Corpus Analysis of the SAP Reference Model (Section 3, pp. 8–16):**
  - Classified **19,838 activity (function) labels** across the SAP Reference Model EPC corpus into three grammatical styles (Table 1, p. 10):
    1. **Verb–Object (VO)** (e.g., *"Execute project billing"*): **11,830 labels (60%)**
    2. **Action–Noun (AN)** (e.g., *"Project billing"* or *"Execution of project billing"*): **6,808 labels (34%)**
    3. **Rest (R)** (irregular noun phrases, state descriptions, conditionals): **1,201 labels (6%)**
  - Identified three linguistic ambiguity mechanisms (Section 3.2, pp. 10–12): **zero-derivation ambiguity** (English words identical as noun and imperative verb, e.g., *"plan"*, *"order"*, *"transfer"*), **action-object ambiguity** (compounds where the action noun and object noun cannot be separated), and **verb-inference ambiguity** (labels omitting the verb altogether).
- **Part 2 — Controlled Empirical Comprehension/Ambiguity Experiment ($N = 29$, Section 4, pp. 16–31):**
  - **Participants & Task:** **$N = 29$ post-graduate students** at Eindhoven University of Technology evaluated **12 activity labels** (4 Verb–Object, 4 Action–Noun, 4 Rest; 6 unambiguous, 6 ambiguous) embedded in a real Dutch municipal government complaint-handling EPC model (**348 label assessments**, pp. 16–21).
  - **What Was Measured:**
    1. *Perceived Ambiguity Ranking* (selecting the 3 most ambiguous labels in the model; Fleiss' $\kappa = 0.607$, Friedman test $p < 0.001$; Section 4.2, pp. 22–23).
    2. *Perceived Usefulness for Comprehension* on a 7-point Likert scale (1 = strongly disagree to 7 = strongly agree; Tables 2–5, pp. 25–30).
- **Key Findings & Numeric Values Stated:**
  - **Probability of Being Rated Ambiguous (Section 4.2, pp. 22–23):**
    - **Verb–Object (VO):** **0.13** (95% CI $[0.08, 0.19]$)
    - **Action–Noun (AN):** **0.24** (95% CI $[0.17, 0.31]$)
    - **Rest (R):** **0.45** (95% CI $[0.32, 0.58]$)
  - **Perceived Usefulness by Grammatical Style (7-point scale, Table 3, p. 27):**
    - **Verb–Object (VO):** mean **5.000**, SD **1.658**, 95% CI $[4.696, 5.304]$
    - **Action–Noun (AN):** mean **4.121**, SD **1.957**, 95% CI $[3.761, 4.480]$
    - **Rest (R):** mean **3.552**, SD **1.922**, 95% CI $[3.199, 3.905]$
    - Repeated-measures ANOVA: **$F = 18.495, p = 0.000$** (highly significant advantage for Verb–Object over Action–Noun and Rest).
  - **Unambiguous vs. Ambiguous Labels (Table 4, p. 28):** Unambiguous mean **4.538** ($95\%	ext{ CI } [4.294, 4.782]$) vs. Ambiguous mean **3.238** ($[3.001, 3.475]$), ANOVA **$F = 31.553, p = 0.000$**.
  - **No Moderation by Domain Knowledge or Process Modeling Experience (Table 5, p. 30):** Neither domain knowledge ($F = 1.363, p = 0.245$) nor EPC modeling knowledge ($F = 1.334, p = 0.239$) mitigated the penalty of non-VO or ambiguous labels.
