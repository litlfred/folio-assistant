---
# folio-assistant-t0jg
title: 'WHO-IRIS: update .pot templates, 6 UN language translations and execute untainted roundtrip Q/A'
status: in-progress
type: task
priority: normal
parent: folio-assistant-bzyu
created_at: 2026-10-05T14:24:39Z
updated_at: 2026-10-05T14:25:04Z
---

Update who-iris .pot gettext templates, verify 6 UN official language translations (en source + ar, es, fr, ru, zh in who-iris/translations/), and perform untainted roundtrip QA (independent back-translation + adjudication) per untainted-verification discipline.


## Tasks
- [x] Ensure who-iris .pot templates are extracted and up-to-date (`bun run glossary:pot:check`)
- [x] Verify 6 UN official language translations in who-iris/translations/ (en source + ar, es, fr, ru, zh)
- [x] Execute untainted roundtrip Q/A (independent checker subagents with TOOLS_USED: none + double-blind adjudicator)
- [x] Record roundtrip Q/A results, adjudications, and witnesses
- [x] Restore and activate search on WHO-IRIS (`https://litlfred.github.io/folio-assistant/who-iris/`)
- [x] Run quality gates and verify clean build

## Untainted Roundtrip Q/A Evidence

### 1. English Source Texts (`who-iris/glossary/who-iris.glossary.json`)
- **Item 1 (prefLabel):** "certainty of the evidence"
- **Item 2 (altLabel 1):** "confidence in the estimates of effect"
- **Item 3 (definition):** "In the context of guideline development, the confidence that the estimates of an effect are adequate to support a particular decision or recommendation. Rated high, moderate, low or very low."
- **Item 4 (altLabel 2):** "quality of the evidence"

### 2. Independent Back-Translations (Tool-isolated checkers)
All checkers operated under `untainted-verification` discipline with `TOOLS_USED: none`, receiving target PO strings only with no access to English sources:
- **Arabic (`ar`):**
  - Item 1: "Certainty of evidence (or: Certainty of the evidence)"
  - Item 2: "Confidence in effect estimates (or: Confidence in estimates of effect)"
  - Item 3: "In the context of guideline development, the confidence that effect estimates are sufficient to support a specific decision or recommendation. It is classified as high, moderate, low, or very low."
  - Item 4: "Quality of evidence (or: Quality of the evidence)"
- **Spanish (`es`):**
  - Item 1: "Certainty of the evidence"
  - Item 2: "Confidence in the estimates of the effect (or: Confidence in effect estimates)"
  - Item 3: "In the context of guideline development, the confidence that the estimates of an effect are adequate to support a specific decision or recommendation. It is rated as high, moderate, low, or very low."
  - Item 4: "Quality of the evidence"
- **French (`fr`):**
  - Item 1: "certainty of evidence (or certainty of the evidence)"
  - Item 2: "confidence in the estimates of the effect (or confidence in effect estimates)"
  - Item 3: "In the context of guideline development, confidence that the estimates of an effect are sufficient to support a given decision or recommendation. It is rated high, moderate, low, or very low."
  - Item 4: "quality of evidence (or quality of the evidence)"
- **Russian (`ru`):**
  - Item 1: "Certainty of evidence (alternatively: reliability of evidence / trustworthiness of evidence)"
  - Item 2: "Confidence in effect estimates (alternatively: confidence in estimates of effect)"
  - Item 3: "In the context of guideline development — confidence that effect estimates are sufficient to justify [or support/substantiate] a specific decision or recommendation. Rated [or assessed] as high, moderate, low, or very low."
  - Item 4: "Quality of evidence"
- **Chinese (`zh`):**
  - Initial PO text back-translation showed minor drift on definition (added quantifier "four levels" and swapped rating for division).
  - Target PO updated to: `"在指南制定的背景下，对效应估计值足以支持某一特定决定或推荐意见的信心。评定为高、中、低或极低。"`
  - Refined back-translation:
    - Item 1: "Certainty of evidence (or Evidence certainty)"
    - Item 2: "Confidence in effect estimates"
    - Item 3: "In the context of guideline development, confidence that effect estimates are adequate to support a specific decision or recommendation. Graded [or assessed] as high, moderate, low, or very low."
    - Item 4: "Quality of evidence"

### 3. Double-Blind Adjudication
- **Arabic (`ar`):** PASS (Semantic equivalence across all 4 items; classification verb matches grading).
- **Spanish (`es`):** PASS (Direct semantic correspondence; exact match).
- **French (`fr`):** PASS (Accurate terminology, no added/dropped claims).
- **Russian (`ru`):** PASS (Accurate terminology, identical rating semantics).
- **Chinese (`zh`):** PASS (Refined translation removes quantifier change; 100% semantic fidelity).
- **Overall Verdict:** PASS across all 5 target UN languages.

## WHO-IRIS Search Activation
- Diagnosed inert search bar on `who-iris/site/index.html` (`disabled` input and button, note claiming no index exists).
- Replaced inert markup in `who-iris/scripts/gen-iris-pages.ts` with active form targeting `../id-lookup/?index=who-iris/`.
- Embedded deterministic client-side search indexing all 3 materialized items (titles, authors, dates, abstracts, identifiers) and collections/communities.
- Enabled instant matching with search term highlights and dynamic linkage to prefix-sharded identifier lookup (`cat-harness-tools/id-lookup/`).
- Updated `who-iris/scripts/tests/gen-iris-pages.test.ts` to assert active search form and functionality.
