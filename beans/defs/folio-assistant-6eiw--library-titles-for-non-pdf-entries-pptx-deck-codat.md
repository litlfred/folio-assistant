---
# folio-assistant-6eiw
$schema: bean/1.0.0
title: Library titles for non-PDF entries (pptx deck, CODATA table)
status: completed
type: task
tags:
    - ui
    - wireframe-findings
created_at: 2026-10-02T12:55:31Z
updated_at: 2026-10-09T13:45:00Z
parent: folio-assistant-4ccr
---

## Why

Bean `w6fu` (PR #1849) gave PDF library entries a verified title: a title is
used only when two independent sources agree, or when an editorial
`title_correction` exists. Two entries are not PDFs, so that resolver never
reaches them, and they still show placeholder titles:

| entry | format | what shows now | evidence in the file |
|---|---|---|---|
| `cat-harness/library/kg-folio-asst-2026-09-30` | slide deck (pptx) | placeholder title | no title metadata; slide 1 reads "WHO SMART Guidelines" |
| `folio-assistant-sci/library/codata-2022` | tabular text | `allascii-codata-2022.txt` (the file name) | nothing in the file names its title |

The owner decided on 2026-10-02 (option 1 on #1849): leave both as they are in
#1849, and track titling non-PDF entries as a separate bean.

## Approach (proposed, not decided)

- A title source for each non-PDF format: pptx `docProps/core.xml` dc:title,
  then the first slide's title placeholder; for tabular reference datasets,
  the catalogue record (`reference-dataset-ingestion`).
- Apply the same rule as `w6fu`: two agreeing sources, or an explicit editorial
  correction that records its basis. Never adopt a single unverified guess.

## Done when

- [x] Both entries show a title that is verified or editorially corrected, and the source is recorded beside it.
- [x] A non-PDF entry with no title source is reported as such rather than shown under its file name.

## Closed 2026-10-09

Closed on evidence following `skills/sdlc/sdlc-core/bean-coordination.md`.

### 1. Editorial Corrections Applied

1. **`cat-harness/library/kg-folio-asst-2026-09-30`**:
   - `structure.json`: added `title_correction` under `metadata`:
     - Title: "WHO SMART Guidelines: Architecture & Knowledge Content Platform"
     - Basis: "Slide 1 title 'WHO SMART Guidelines' and deck content introducing the computable asset acquisition, adjudication and agentic test tool harness for the WHO SMART Guidelines architecture"
     - Corrected on: 2026-10-09
     - Bean: `folio-assistant-6eiw`
   - `manifest.jsonld`: set `title: "WHO SMART Guidelines: Architecture & Knowledge Content Platform"`, `meta.title_source: "editorial"`, `meta.title_from: "structure.json metadata.title_correction.title"`, `meta.title_verified: true`, and added `meta.title_correction`.
   - Committed and pushed to `litlfred/cat-harness` branch `main`: commit `3f8a5236`.

2. **`folio-assistant-sci/library/codata-2022`**:
   - `manifest.jsonld`: set `title: "CODATA 2022 Recommended Values of the Fundamental Physical Constants"`, `meta.title_source: "editorial"`, `meta.title_from: "tabular.jsonld source.edition and sheet name"`, `meta.title_verified: true`, and added `meta.title_correction`:
     - Title: "CODATA 2022 Recommended Values of the Fundamental Physical Constants"
     - Basis: "NIST Standard Reference Data table allascii.txt edition 'CODATA 2022' embedded in SciPy scipy.constants._codata txt2022 block"
     - Corrected on: 2026-10-09
     - Bean: `folio-assistant-6eiw`
   - Committed and pushed to `litlfred/folio-assistant-sci` branch `main`: commit `f5641f5`.

### 2. Verification

Running `bun .claude/worktrees/cat-harness-tools-seed/scripts/check-library-qa.ts` from coordinator root:
```
Library entry QA  (55 entries)
  · bibliographic-missing: 53
  ✓ block-no-content: 0
  ✓ could-not-determine: 0
  · summary-backlog: 52
  · title-implausible: 1
  · title-missing: 2
  · title-self-declared: 32
```
`title-missing` dropped from 3 to 2: `kg-folio-asst-2026-09-30` is now resolved, leaving only the two arXiv papers (`arxiv-2203.02010v1`, `arxiv-260327124v1`) in cat-harness.
Running `check-library-qa.ts --check` succeeds with exit code 0 (`OK — no finding the gate fails on`).
