<!-- kg:subgraph:begin -->
# Semantics and Analysis of DMN Decision Tables

ingested source material — attributed to its document, not folio content

Held in the library [`cat-harness/library/`](../../README.md) as `arxiv-1603.07466v1`.

| | |
|---|---|
| document id | `arxiv-1603.07466v1` |
| source file | `arxiv-1603-07466v1.pdf` (sha256 `0a0fd1ae1ced…`) |
| pages | 16 |
| arXiv | [1603.07466v1](https://arxiv.org/abs/1603.07466v1) |
| provenance | ingested |

| holds | count |
|---|---|
| [sections](sections/) | 2 |
| [blocks](blocks/) | 2 |
| images | 1 |

<!-- kg:subgraph:end -->

## Structured Research Notes (Bean `folio-assistant-e0jh`)

- **Citation:** Calvanese, D., Dumas, M., Laurson, Ü., Maggi, F. M., Montali, M. & Teinemaa, I. (2016). *Semantics and Analysis of DMN Decision Tables.* arXiv preprint `arXiv:1603.07466v1` (published in *Business Process Management — BPM 2016*, LNCS 9850, pp. 217–234, Springer, `doi:10.1007/978-3-319-45348-4_13`).
- **DOI / arXiv:** `10.1007/978-3-319-45348-4_13` / `arXiv:1603.07466v1`
- **URL Fetched:** `https://arxiv.org/pdf/1603.07466.pdf`
- **Copy Used:** arXiv preprint (16 pages)
- **Fetch Date:** `2026-10-31`
- **SHA-256:** `8fb29d478d249ef4709fb464821a5b9004e5504d546fb4b120e4475f5140425f`
- **Licence & Ingestion Route:** `LicenseRef-arXiv-Nonexclusive-Distrib-1.0` (Full-text `pdf-structure` rung)
- **Study Design (Answers Bean DMN Question on Paper 23 — Is there any human study in it?):**
  - **NO human study exists in this paper.**
  - Formalization + **computational algorithm benchmark** (Section 5, pp. 14–16): defines a formal S-FEEL semantics for DMN decision tables (Section 3, pp. 4–9) and geometric sweep-line algorithms interpreting rules as $N$-dimensional iso-oriented hyper-rectangles (Section 4, pp. 9–14) to detect **overlapping rules** (`FindOverlappingRules`, Algorithm 1 p. 11) and **missing rules / incompleteness** (`FindMissingRules`, Algorithm 3 p. 13).
  - **Experimental Benchmark Setup (Section 5, p. 14):** Trained WEKA J48 decision trees on a Kaggle credit-lending dataset (150,000 rows, 10 attributes) to generate **9 large synthetic DMN decision tables** with **3, 5, and 7 input columns** and **~500, ~1,000, and ~1,500 rules** (`499` to `1,506` rules), mutating 10% of rules to inject overlaps and deleting 10% to inject missing rules.
- **What Was Measured:** Execution time in milliseconds (**Table 2, p. 15**) and count of reported overlapping/missing rule errors compared against the **Signavio DMN editor** (**Table 3, p. 16**).
- **Numeric Thresholds & Key Findings:**
  - **Runtime Scalability (Table 2, p. 15):** Overlapping-rule detection runs in **`200 ms` to `30,736 ms`** and missing-rule detection runs in **`160 ms` to `18,263 ms`** on tables up to `1,506` rules and `7` columns.
  - **Diagnostic Conciseness vs. Signavio (Table 3, p. 16):** Because Signavio redundantly reports every pairwise/subset intersection when multiple rules overlap, Signavio reports **`1,226` to `62,217` overlapping rule sets** and **`563` to `43,552` missing rules**, whereas Calvanese et al.'s maximal-intersection and geometric-merging algorithms report only **`110` to `812` maximal overlapping rule sets** and **`117` to `726` consolidated missing rules** ($5\times\text{ to }160\times$ fewer redundant diagnostics).
