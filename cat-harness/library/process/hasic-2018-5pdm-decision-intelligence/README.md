<!-- kg:subgraph:begin -->
# Augmenting processes with decision intelligence: Principles for integrated modelling

referenced source — recorded, text withheld by licence

Held in the library [`cat-harness/library/`](../../README.md) as `hasic-2018-5pdm-decision-intelligence`.

| | |
|---|---|
| document id | `hasic-2018-5pdm-decision-intelligence` |
| source file | `hasic-2018-5pdm-decision-intelligence.pdf` (sha256 `8c4e0623a596…`) |
| provenance | ingested |

| holds | count |
|---|---|
| [sections](sections/) | 0 |
| [blocks](blocks/) | 0 |
| images | 0 |

<!-- kg:subgraph:end -->

## Structured Research Notes (Bean `folio-assistant-e0jh`)

- **Citation:** Hasić, F., De Smedt, J. & Vanthienen, J. (2018). *Augmenting processes with decision intelligence: Principles for integrated modelling.* Decision Support Systems, 107, 1–12.
- **DOI:** `10.1016/j.dss.2017.12.008`
- **URL Fetched:** `https://lirias.kuleuven.be/retrieve/30b4014a-4721-421c-ac8a-7165629de055` (and companion KU Leuven technical report KBI_1717 at `https://lirias.kuleuven.be/retrieve/466070`)
- **Copy Used:** Author accepted manuscript (KU Leuven Lirias repository, 20 pages) + companion technical report KBI_1717 (10 pages)
- **Fetch Date:** `2026-10-31`
- **SHA-256:** `8c4e0623a596f69b6fda500b5a827a25460daca6cb7f18509946410450991c0f` (accepted manuscript) / `4d632189964f0cb38a1b54f441cf33ee959f1bd9ca7dc76cf78fb4b321eb4672` (KBI_1717 companion report)
- **Licence & Ingestion Route:** `LicenseRef-Elsevier-Copyright` (Elsevier copyright — Notes-only `referenced.json` rung)
- **Study Design:** Design science formalization of integrated BPMN + DMN models (Section 4, pp. 4–7), taxonomy of **5 process–decision inconsistency classes (`I1–I5`)** (Section 5, pp. 7–10), derivation of the **Five Principles for Integrated Process and Decision Modelling (`5PDM`)** (Section 6, pp. 10–11, Table 1 p. 11), and industrial case validation at a Belgian accounting firm (Section 7, pp. 11–16).
- **What Was Measured:** Detection and elimination of structural and data-flow inconsistencies between BPMN control flow and DMN Decision Requirements Diagrams (DRDs).
- **Numeric Thresholds & Key Findings (The 5PDM Principles, Section 6 pp. 10–11 & Table 1 p. 11):**
  - **P1:** *Include all necessary decision outcomes in the process control flow* (remedies missing outgoing gateway paths for valid DMN decision outcomes, p. 10).
  - **P2:** *Exclude decision logic and cascading XOR-splits from the process* (externalize business rules into DMN rather than hard-coding cascading XOR gateways in BPMN, p. 10).
  - **P3:** *Include only subdecisions that directly influence the process* (pp. 10–11):
    - **P3.1:** *Include subdecisions whose results are used in the process.*
    - **P3.2:** *Include subdecisions that affect the process control flow.*
    - **P3.3:** *Exclude subdecisions that are irrelevant to the process* (keep purely internal intermediate decisions inside the DMN DRD, not as separate BPMN tasks).
  - **P4:** *Include decision hierarchy in decision activity modelling* (order BPMN decision tasks consistently with the DMN DRD dependency hierarchy, p. 11).
  - **P5:** *Include input data and intermediate results for decision enactment* (model required BPMN data objects so every invoked DMN decision has its required inputs available, p. 11).
