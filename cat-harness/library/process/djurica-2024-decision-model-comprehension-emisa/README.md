<!-- kg:subgraph:begin -->
# Investigating the impact of representation features on decision model comprehension (Extended Abstract)

ingested source material — attributed to its document, not folio content

Held in the library [`cat-harness/library/`](../../README.md) as `djurica-2024-decision-model-comprehension-emisa`.

| | |
|---|---|
| document id | `djurica-2024-decision-model-comprehension-emisa` |
| source file | `djurica-2024-decision-model-comprehension-emisa.pdf` (sha256 `cee7faf2a265…`) |
| pages | 3 |
| DOI | [10.18420/EMISA2024_05](https://doi.org/10.18420/EMISA2024_05) |
| provenance | ingested |

| holds | count |
|---|---|
| [sections](sections/) | 10 |
| [blocks](blocks/) | 5 |
| images | 0 |

<!-- kg:subgraph:end -->

## Structured Research Notes (Bean `folio-assistant-e0jh`)

- **Citation:** Djurica, D., Kummer, T.-F., Mendling, J. & Figl, K. (2024). *Investigating the impact of representation features on decision model comprehension (Extended Abstract).* In: *EMISA 2024*, GI Lecture Notes in Informatics (LNI), pp. 35–37 (`doi:10.18420/EMISA2024_05`). Companion full article: Djurica, D., Kummer, T.-F., Mendling, J. & Figl, K. (2023/2025), *Investigating the impact of representation features on decision model comprehension*, *European Journal of Information Systems*, 34(1), 21–45 (`doi:10.1080/0960085X.2023.2270456`).
- **DOI:** `10.18420/EMISA2024_05` (EMISA 2024 extended abstract) / `10.1080/0960085X.2023.2270456` (EJIS full article)
- **URL Fetched:** `https://dl.gi.de/server/api/core/bitstreams/f806d101-1ccb-49c0-aba9-90d59184383c/content` (Note: direct fetch of `https://www.tandfonline.com/doi/pdf/10.1080/0960085X.2023.2270456` is blocked by Taylor & Francis Cloudflare challenge; full-text EJIS Table 3 & Table 4 statistics were retrieved via indexed full-text search.)
- **Copy Used:** Publisher version of EMISA 2024 extended abstract (GI Digital Library Open Access PDF, 3 pages, CC BY 4.0) + indexed statistics from the CC BY 4.0 EJIS full article
- **Fetch Date:** `2026-10-31`
- **SHA-256:** `d89f111602a8136339ab35cf215379c3f9937e8490599228dc66c1be80dc2124`
- **Licence & Ingestion Route:** `CC-BY-4.0` (Full-text `pdf-structure` rung)
- **Study Design:** Within-subject $2 \times 2 \times 2$ factorial experiment (**$n = 139$ participants** recruited via Prolific, **32 comprehension questions** per participant, complemented by an exploratory eye-tracking study) crossing three factors (EMISA 2024 Section 2, p. 36; EJIS Section 3):
  1. **Representation Type:** Decision Table vs. Decision Tree
  2. **Representation Structure:** Expanded (complete value combinations) vs. Frugal (contracted with `-` don't-care cells / fast-and-frugal pruning; see Fig. 1 p. 36)
  3. **Representation Design:** Monochromatic vs. Coloured highlighting
- **What Was Measured:** Comprehension accuracy (% correct across 32 questions, analyzed via binomial generalized linear mixed-effects regression with Wald tests in EJIS Table 3 & Table 4) and eye-tracking visual search paths.
- **Numeric Thresholds & Key Findings (Answers Bean DMN Question on Paper 21 — Colour Result for Tables vs. Trees with Significance):**
  - **Descriptive Accuracy Across All 8 Experimental Conditions (EJIS Table 3, sorted ascending):**
    1. **Monochromatic Expanded Decision Trees:** **`69.67%`** (SD `0.46`)
    2. **Coloured Expanded Decision Trees:** **`75.82%`** (SD `0.43`)
    3. **Coloured Expanded Decision Tables:** **`76.84%`** (SD `0.42`)
    4. **Monochromatic Expanded Decision Tables:** **`78.28%`** (SD `0.41`)
    5. **Monochromatic Frugal Decision Trees:** **`81.76%`** (SD `0.39`)
    6. **Coloured Frugal Decision Trees:** **`85.00%`** (SD `0.36`)
    7. **Coloured Frugal Decision Tables:** **`86.47%`** (SD `0.34`)
    8. **Monochromatic Frugal Decision Tables:** **`92.83%`** (SD `0.26`) — highest comprehension accuracy overall.
  - **Mixed-Effects Regression & Statistical Significance (EJIS Table 4; EMISA 2024 Section 2, p. 36):**
    - **Main Effect of Structure (Expanded vs. Frugal):** Highly significant (**$p < 0.001$**) — frugal/contracted representations significantly outperform expanded ones.
    - **Main Effect of Type (Table vs. Tree):** Statistically significant (**Model 1: $\text{OR} = 0.52, p = 0.035$; Model 2: $\text{OR} = 0.51, p = 0.046$; Model 3: $\text{OR} = 0.60, p = 0.009$**) — decision tables achieve higher comprehension accuracy than decision trees.
    - **Main Effect of Design (Monochromatic vs. Colour):** Not significant on its own (**Model 1: $\text{OR} = 0.78, p = 0.423$; Model 2: $\text{OR} = 0.74, p = 0.376$; Model 3: $\text{OR} = 0.87, p = 0.496$**).
    - **Interaction Effect: Type $\times$ Design (Table/Tree $\times$ Monochromatic/Colour):** Statistically significant (**Model 1: $\text{OR} = 2.12, p = 0.039^*$; Model 2: $\text{OR} = 2.20, p = 0.048^*$; Model 3: $\text{OR} = 1.57, p = 0.063$**):
      - **Colour HELPS Decision Trees:** increases accuracy from **`69.67%` $\to$ `75.82%`** (expanded) and **`81.76%` $\to$ `85.00%`** (frugal) (overall tree accuracy **`75.72%` $\to$ `82.38%`**), guiding visual search along branches.
      - **Colour HURTS Decision Tables:** decreases accuracy from **`78.28%` $\to$ `76.84%`** (expanded) and **`92.83%` $\to$ `86.47%`** (frugal), because eye-tracking shows dense cell colour highlighting acts as visual distraction when scanning tabular rows and columns (EMISA 2024 p. 36).
