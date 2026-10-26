---
# folio-assistant-0lde
$schema: bean/1.0.0
title: 'L1 EVIDENCE: ingest the external evidence an L1 guideline computes from (PICO question sets, Cochrane/WHO systematic reviews, GRADE profiles)'
status: in-progress
type: task
created_at: 2026-10-04T10:13:24Z
updated_at: 2026-10-26T11:20:00Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-01 (qvxh): smart-L1 is 'fully computable from smart-base assets (and maybe some other things like PICO, cochrane, etc)'. Owner, 2026-10-04 (qvxh option 1): name what is not yet a graph rather than fake one.

Four l1-guideline sections (key-questions, evidence-retrieval-and-synthesis, certainty-of-evidence, evidence-to-decision) are computed from evidence smart-base has not ingested. So they carry no `computedFrom` and say so in their descriptions, and check:document-kind-sources would refuse a claim naming an undeclared graph.

## Done when
- [ ] the evidence sources are chosen and named: which systematic reviews, from where, and under which licence (Cochrane content is not openly licensed by default)
- [ ] a declared graph holds them (no empty declaration: dh4f)
- [ ] the four sections name it in computedFrom, and check:document-kind-sources passes
- [ ] needs network: WHO IRIS / Cochrane Library are unreachable from the cloud container (2026-10-04)

## Claimed 2026-10-24 (FHIR beans thread, session_01Bye99WLJxQpyCxh2eMgW19)

Measured: none of the 12 documents in `smart-base/library/` is a clinical guideline with GRADE or evidence-to-decision tables (all are digital-health handbooks). iris.who.int, cochranelibrary.com and ncbi.nlm.nih.gov are refused by the container proxy. Asked the owner: allow iris.who.int and ingest WHO ANC 2016, or ingest an uploaded PDF, or leave open.

_2026-10-24T08:24:20Z_ — Owner chose option A (WHO ANC 2016 from IRIS) and asked for a connected-agent bean for the download: **folio-assistant-d08l**. After it lands: section it into `smart-base/library/`, declare the graph, and point the four sections' `computedFrom` at it.

## 2026-10-24 (`d08l` connected-agent download) — WHO 2016 ANC PDFs & Evidence Mapping

Committed all three English PDFs from WHO IRIS handle **`10665/250796`** (`https://iris.who.int/handle/10665/250796`, ISBN `9789241549912`, licence `CC BY-NC-SA 3.0 IGO`, downloaded `2026-10-24`) plus their `folio-fsh-guts/v1` `.md` provenance notes to `litlfred/folio-assistant` branch **`cat/cat-harness/fsh-guts`** at commit **`cf2b8bd4663cf51435443a1ec4942d260a8060c8`**:

| File in `fsh-guts/uploads/` | Bitstream URL | Pages | SHA-256 |
|---|---|---:|---|
| `9789241549912-eng.pdf` (+ `.md`) | `https://iris.who.int/server/api/core/bitstreams/9dccde13-3593-4a22-9237-61abe5a3c6b7/content` | 172 (`i–xvi, 1–152`) | `338300b76172d410b91048209305fac53e1166c3be295a18b3f2c0c7c6b54182` |
| `9789241549912-webannexes-eng.pdf` (+ `.md`) | `https://iris.who.int/server/api/core/bitstreams/76cde7e1-2b67-4318-9b0e-fe3bf9b103e4/content` | 24 (`i, 1–20`) | `2be50b7493beb2bcced1f533aabc11123d40931381a6b449a6ecacc60deb2a0a` |
| `9789241549912-websupplement-eng.pdf` (+ `.md`) | `https://iris.who.int/server/api/core/bitstreams/b87b9d47-74bc-4330-a79a-10ee1151a13d/content` | 129 (`i–viii, 1–120`) | `e7b751d90bc6b0ea4aed09718de979dea272241c89300082454c39a0ee73908c` |

### Which file holds which of the four L1 evidence kinds

1. **`key-questions` (PICO):**
   - **Primary tabular PICO source — `9789241549912-webannexes-eng.pdf`:**
     - **Web annex 1** (printed pp. 1–7 / PDF pp. 4–10): Complete table of all 47 priority PICO questions (`A.1.1`–`A.10`, `B.1.1`–`B.1.8`, `B.2.1`–`B.2.5`, `C.1`–`C.7`, `D.1`–`D.6`, `E.1`–`E.7`) with explicit `P=Population; I=Intervention; C=Comparator; O=Outcomes` formulation and priority maternal, fetal/newborn, test-accuracy, and health-system outcomes.
     - **Web annex 2** (printed pp. 8–9 / PDF pp. 11–12): 12 PICO questions omitted after proposal approval, with reasons.
   - **Methods & outcomes overview — `9789241549912-eng.pdf`:** Chapter 1 Box 1 (*Guideline outcomes of interest*, printed p. 3 / PDF p. 21) and Chapter 2 §§2.6–2.8 (printed pp. 5–7 / PDF pp. 23–25).
2. **`evidence-retrieval-and-synthesis`:**
   - **Narrative synthesis & methods — `9789241549912-eng.pdf`:** Chapter 2 §2.9 & Box 2 (*Five work streams*, printed pp. 7–8 / PDF pp. 25–26) and Chapter 3 (*Evidence and recommendations*, printed pp. 13–104 / PDF pp. 31–122), where each intervention section (`3.A`–`3.E`) carries *Background* and *Summary of evidence and considerations* synthesizing the Cochrane effectiveness reviews, DTA reviews, and qualitative evidence syntheses.
   - **Search strategies, systematic review citations & meta-analyses — `9789241549912-websupplement-eng.pdf`:** *Search strategies for the evidence base* (printed pp. 113–120 / PDF pp. 121–128) covering 5 search streams, plus explicit `Source:` citations of the underlying Cochrane/DTA reviews and subgroup forest plots across `EB Table A.1.1`–`EB Table E.7` (printed pp. 1–112 / PDF pp. 9–120).
3. **`certainty-of-evidence` (GRADE):**
   - **Primary full GRADE Evidence Base profiles — `9789241549912-websupplement-eng.pdf`:** `EB Table A.1.1` through `EB Table E.7` (printed pp. 1–112 / PDF pp. 9–120) with full GRADE domains (*No. of studies*, *Design*, *Risk of bias*, *Inconsistency*, *Indirectness*, *Imprecision*, *Other considerations*, *No. of women*, *Effect (Relative 95% CI, Absolute)*, *Certainty* `HIGH`/`MODERATE`/`LOW`/`VERY LOW`, and downgrade footnotes).
   - **Summary certainty column per recommendation — `9789241549912-webannexes-eng.pdf`:** Web annex 3 (printed pp. 10–20 / PDF pp. 13–23), *Certainty of the evidence* column.
   - **GRADE / GRADE-CERQual methods & inline narrative statements — `9789241549912-eng.pdf`:** Chapter 2 §§2.10, 2.15 (printed pp. 8–9, 11 / PDF pp. 26–27, 29) and Chapter 3 narrative statements (printed pp. 14–104 / PDF pp. 32–122).
4. **`evidence-to-decision`:**
   - **Primary tabular GDG EtD judgements — `9789241549912-webannexes-eng.pdf`:** **Web annex 3** (*Guideline Development Group (GDG) judgements related to the recommendations*, printed pp. 10–20 / PDF pp. 13–23): DECIDE EtD judgement tables for all recommendations (`A.1.1`–`E.7`) across *Certainty of the evidence*, *Effects*, *Women's values*, *Resource use*, *Equity*, *Acceptability*, *Feasibility*, *Balance of benefits versus disadvantages*, and *GDG decision*.
   - **Primary narrative EtD domain summaries & methods — `9789241549912-eng.pdf`:** Chapter 2 §§2.11–2.12 (printed pp. 9–10 / PDF pp. 27–28) and the per-recommendation narrative DECIDE subsections (*Women's values*, *Values*, *Resources*, *Equity*, *Acceptability*, *Feasibility*, *Additional considerations*) across Chapter 3 (printed pp. 14–104 / PDF pp. 32–122).

## 2026-10-26 (FHIR beans thread, session_01Bye99WLJxQpyCxh2eMgW19): ingested, PR open

The three d08l PDFs are ingested into smart-base/library as `9789241549912-eng`, `-webannexes-eng` and `-websupplement-eng` (sha256 values match). The four l1-guideline evidence sections now name `computedFrom: ["library"]`, with sources citing web annexes 1-3, the supplement's EB tables and search strategies, and the methods chapter. check:document-kind-sources passes. Licence: the PDFs say "(c) WHO 2016 All rights reserved", which is recorded; the d08l note's CC BY-NC-SA 3.0 IGO is not stated in the PDFs. PR litlfred/smart-base#164 (issue #163).

- [x] evidence sources chosen and named
- [x] a declared graph holds them (library)
- [x] the four sections name it in computedFrom; check:document-kind-sources passes
- [ ] #164 merged
