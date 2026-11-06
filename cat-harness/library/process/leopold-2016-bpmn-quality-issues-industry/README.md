<!-- kg:subgraph:begin -->
# Learning from Quality Issues of BPMN Models from Industry

referenced source — recorded, text withheld by licence

Held in the library [`cat-harness/library/`](../../README.md) as `leopold-2016-bpmn-quality-issues-industry`.

| | |
|---|---|
| document id | `leopold-2016-bpmn-quality-issues-industry` |
| source file | `leopold-2016-bpmn-quality-issues-industry.pdf` (sha256 `0b210a3c9afb…`) |
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
| **Citation** | Leopold, H., Mendling, J., & Günther, O. (2016). *Learning from Quality Issues of BPMN Models from Industry*. *IEEE Software*, 33(4), 26–33 (`doi:10.1109/MS.2015.81`); extended abstract in *EMISA 2016*, CEUR-WS Vol-1701, Paper 9, pp. 36–39. |
| **URL Fetched** | `https://ceur-ws.org/Vol-1701/paper9.pdf` (authors' open-access EMISA 2016 extended abstract of the *IEEE Software* paper linked from WU Wien repository `https://research.wu.ac.at/en/publications/learning-from-quality-issues-of-bpmn-models-from-industry-3`; ResearchGate `273258454` returned HTTP 403 and IEEE Xplore `doi:10.1109/MS.2015.81` is paywalled) |
| **Fetch Date** | `2026-10-31` |
| **SHA-256** | `0b210a3c9afbe8b98df0cb084d4abfb0a6a1f3f1d00e10e944462c2ab8fdcf78` |
| **Licence** | `LicenseRef-IEEE-Copyright` (Copyright 2016 IEEE; CEUR-WS Vol-1701 companion extended abstract) |
| **Ingestion Route** | **Notes only (`referenced.json`)** — full text withheld under publisher copyright |

## Study Design & Empirical Measurements

- **Industry Corpus & Automated Rule Check:**
  - Evaluated **585 BPMN 2.0 process models from 6 industry companies** (across telecommunications, finance, automotive, and service sectors; Section 1 p. 1, Section 2 p. 2) against **35 BPMN modeling guidelines** synthesized from Silver (2011), Allweyer (2009), and White & Miers (2008).
  - Grouped quality defects into **three overarching dimensions** (Fig. 1, p. 2):
    1. **Structure** (syntactic errors, behavioral soundness errors such as deadlocks and multi-merges, decomposition & role consistency between main processes and subprocesses),
    2. **Layout** (inappropriate element spacing, incorrect modeling direction / backward-flowing arcs, inconsistent incoming/outgoing gateway port behavior, overlapping edges and nodes, excessive diagram size), and
    3. **Labeling** (violation of verb–object / syntactic naming conventions for activities, events, and gateways; missing links to domain glossaries).
- **Answer to Bean Open Question 2 ("banana model"):**
  - Leopold, Mendling & Günther (2016) report on **585 BPMN 2.0 models from 6 companies** and **do NOT use the phrase "banana model"**. Their formal Layout defect categories are **inappropriate spacing**, **incorrect modeling direction** (*"arcs flowing into the wrong direction"*), **inconsistent incoming and outgoing behavior**, **overlay of edges and nodes**, and **excessive diagram size** (Fig. 1, p. 2; Section 2, pp. 2–3). *(Compare Figl & Strembeck 2015, p. 12, who refer to models that bend/reverse flow direction to fit a page as **"zigzag models"**.)*
- **Key Findings & Numeric Thresholds Stated (pp. 2–3; see also Avila 2018/2021 pp. 38–40):**
  - **Syntactic Correctness:** **~99%** of the 585 models are free of basic BPMN syntactic violations (tool validation enforces syntax; p. 2).
  - **Control-Flow Soundness Defects:** **22%** of models contain **deadlocks** and **42%** contain **multi-merges** (unsynchronized multiple activations; p. 2).
  - **Subprocess Role Consistency:** **86%** of models using subprocesses have inconsistent role/lane associations between the parent process and the subprocess (p. 2).
  - **Maximum Diagram Canvas Size Threshold:** **1 DIN A3 page** — **47%** of all industry models exceed the size of a DIN A3 page (p. 3; cited as Guideline C2.1 in Avila 2018, p. 38).
  - **Minimum Element Spacing Threshold:** **At least 50% of an element's size** between adjacent elements (Fig. 1 p. 2; cited as Guideline C6 in Avila 2018, p. 40).
  - **Labeling & Glossary Violations:** **40%–47%** of model elements violate syntactic naming conventions (e.g., verb–object for tasks, object–past-participle for events, question for XOR splits), and **72% of roles** and **77% of data objects** are not linked to an organizational glossary (p. 3).
