<!-- kg:subgraph:begin -->
# A systematic literature review of process modeling guidelines and their empirical support

referenced source — recorded, text withheld by licence

Held in the library [`cat-harness/library/`](../../README.md) as `avila-2021-process-modeling-guidelines-slr`.

| | |
|---|---|
| document id | `avila-2021-process-modeling-guidelines-slr` |
| source file | `avila-2021-process-modeling-guidelines-slr.pdf` (sha256 `067220872237…`) |
| provenance | ingested |

| holds | count |
|---|---|
| [sections](sections/) | 0 |
| [blocks](blocks/) | 0 |
| images | 0 |

<!-- kg:subgraph:end -->

## Structured Research Notes (Bean `folio-assistant-e0jh`)

- **Citation:** Avila, D. T., dos Santos, R. I., Mendling, J. & Thom, L. H. (2021). *A systematic literature review of process modeling guidelines and their empirical support.* Business Process Management Journal, 27(1), 1–23. (Companion full catalogue: Avila, D. T., 2018, *An Analysis of Process Modeling Guidelines and Their Empirical Support*, UFRGS LUME Thesis, 71 pp.)
- **DOI:** `10.1108/BPMJ-10-2019-0407`
- **URL Fetched:** `https://lume.ufrgs.br/bitstream/handle/10183/180494/001069548.pdf`
- **Copy Used:** Companion full catalogue / thesis (UFRGS LUME repository, 71 pages; companion to Emerald BPMJ 27(1):1-23 article)
- **Fetch Date:** `2026-10-31`
- **SHA-256:** `0bd509be622854bc4d03563c0178abdd6cf0cfbc8a3fa8d8dd460565d90f8c10`
- **Licence & Ingestion Route:** `LicenseRef-Emerald-Copyright` (Emerald publishing copyright — Notes-only `referenced.json` rung)
- **Study Design:** Systematic Literature Review of **55 primary studies** identifying **68 distinct process modeling guidelines** grouped into **4 categories** — **A: Element Usage & Size thresholds** (`A1–A7`), **B: Structure & Decomposition** (`B1–B9`), **C: Layout & Visual Representation** (`C1–C11`), and **D: Labeling & Glossary** (`D1–D5`) — and grading each by empirical evidence strength (*Strong*, *Moderate*, *Weak*, *No empirical violation found*, or *Untested*).
- **What Was Measured:** Empirical support level for each of the 68 guidelines across comprehension accuracy, error probability, reading time, and perceived understandability.
- **Numeric Thresholds & Key Findings:**
  - **Table 3.2 (pp. 29–33, Category A — Size & Element Thresholds):**
    - **A1 (Total Model Size):** $\le 37$ elements for comprehension efficiency (Sánchez-González et al. 2013), $\le 31$ nodes for error probability (Mendling et al. 2012), or $\le 50$ elements before decomposition (Mendling et al. 2010 7PMG G7) — **Strong empirical support** (p. 29).
    - **A2 (Number of Activities):** $\le 31$ activities — **Strong empirical support** (p. 29).
    - **A3 (Number of Events):** $\le 7$ events total — **Moderate empirical support**; **A3.1:** exactly **1 start event** and **1 end event** (or $\le 2$ per Mendling et al. 2012) (p. 29).
    - **A4 (Number of Gateways):** $\le 18$ gateways total — **Strong empirical support**; **A4.1:** **0 OR-gateways** (avoid inclusive OR splits/joins) — **Strong empirical support** (pp. 29–30).
    - **A5 (Pools & Lanes):** $\le 4$ pools/lanes — **Moderate empirical support** (p. 29).
    - **A6 (Sequence Flows & Degree):** $\le 34$ sequence flows (**Strong**); **A6.1:** activity degree $= 2$ ($1$ incoming, $1$ outgoing); **A6.2:** gateway degree $\le 5$ (**Strong**) or average connector degree $\le 3$ (Mendling et al. 2012) (p. 29).
    - **A7 (Diameter / Longest Path):** $\le 15$ nodes along longest path — **Weak empirical support** (p. 29).
  - **Table 3.3 (pp. 35–37, Category B — Structure & Decomposition):**
    - **B1 (Block-Structuredness):** match every split gateway with a corresponding join gateway of the same type — **Strong empirical support** (p. 35).
    - **B7 (Subprocess Decomposition Threshold):** decompose when model exceeds $31	ext{–}50$ elements, grouping **$5	ext{ to }7$ activities** per subprocess — **Moderate empirical support** (p. 37).
  - **Table 3.4 (pp. 38–40, Category C — Layout & Visual Representation):**
    - **C1 (Consistent Flow Direction):** model consistently Left-to-Right (LR) or Top-to-Bottom (TB) — **Strong empirical support** (p. 38).
    - **C2.1 (Canvas Page Limit):** fit diagram within **1 DIN A3 page** (citing Leopold et al. 2016) (p. 38).
    - **C3 / C4 (Edge Crossings & Bends):** minimize edge crossings (**C3**, **Strong**) and edge bend points (**C4**, **Strong**) (pp. 38–39).
    - **C6 (Minimum Element Spacing):** keep spacing between elements $\ge 50\%$ of element size (citing Leopold et al. 2016) (p. 40).
  - **Table 3.5 (pp. 41–42, Category D — Labeling):**
    - **D1.1:** Verb–Object (`VO`) phrase style for activities — **Strong empirical support** (p. 41).
    - **D3.4:** Keep label words concise (**$< 8$ letters** average word length) — **Moderate empirical support** (p. 42).
