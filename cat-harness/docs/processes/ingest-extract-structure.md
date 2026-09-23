---
title: 'Ingestion subprocess — extract structure'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/ingest-extract-structure.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Ingestion subprocess — extract structure

`Process_ExtractStructure` · advisory · 5 step(s)

folio-assistant — Ingestion subprocess — extract structure. Source of truth: this file. Open it in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool. The SVG under docs/assets/img/workflows/ is generated from it by `bun run render:bpmn` — never hand-edit the SVG. The <folio:skill> extension on an activity names the folio-assistant skill that implements it; <folio:bean> marks a step that reads or writes the shared work plan in beans/.

<img src="../assets/img/workflows/ingest-extract-structure.svg" alt="BPMN diagram: Ingestion subprocess — extract structure" style="max-width:100%">

## How it connects

- **Called by:** [Document ingestion — uploads/ to the L1 source knowledge graph](document-ingestion.html)
- **Calls:** none

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Ingestion Engine (agent, runs unattended) | — | Two provenance paths converge on the same Task_Sections output — an embedded text layer extracted directly, or OCR that leaves the fuller text in ocr/ with only a stub in sections/ — and which branch this lane took is invisible downstream except to a grep that knows to check the fourth tier. Task_Candidates is the last step and it stays a proposal: theorems and definitions extracted here are never adjudicated verdicts, so nothing downstream may treat this lane's output as settled. |

## Steps

**2** of 5 step(s) carry no documentation — `activity-documented` lists them.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Extract the text layer**<br>`Task_ExtractText` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | — |
| **OCR to ocr/page-*.txt**<br>`Task_Ocr` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | A document ingested this way keeps its text in ocr/ and only a stub in sections/, which the documented sections/ grep cannot see. That asymmetry is why the corpus-grep checklist has a fourth tier. |
| **Split into sections/*.md with doc_brief front-matter**<br>`Task_Sections` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | Contextual retrieval: a chunk in isolation loses what makes it mean anything, so each section carries the document brief. |
| **Write structure.json (TOC, page ranges, metadata)**<br>`Task_Structure` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | — |
| **Extract claim candidates**<br>`Task_Candidates` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | candidates.json holds extracted theorems and definitions. Proposals only -- never adjudicated verdicts. |

{% endraw %}
