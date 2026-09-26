---
title: 'Ingestion subprocess — derive content from the assets'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/ingest-derive-content.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Ingestion subprocess — derive content from the assets

`Process_DeriveContent` · advisory · 6 step(s)

folio-assistant — Ingestion subprocess — derive content from the assets. Source of truth: this file. Open it in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool. The SVG under docs/assets/img/workflows/ is generated from it by `bun run render:bpmn` — never hand-edit the SVG. The <bootstrap.processes:skill> extension on an activity names the folio-assistant skill that implements it; <cat-harness.processes:bean> marks a step that reads or writes the shared work plan in beans/.

<img src="../assets/img/workflows/ingest-derive-content.svg" alt="BPMN diagram: Ingestion subprocess — derive content from the assets" style="max-width:100%">

## How it connects

- **Called by:** [Document ingestion — uploads/ to the L1 source knowledge graph](document-ingestion.html)
- **Calls:** none
- **Presented on:** [Document ingestion — Derive content](../document-ingestion.html#derive-content)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Ingestion Engine (agent, runs unattended) | `ingestion-agent` | The only lane in this subprocess, so nothing produced here is checked by a different party before it reaches the L1 graph. Five of these six tasks carry their own NOT IMPLEMENTED note; Task_Provenance does not, and its citation of who or what wrote each narrative is what is meant to stand between a generated description and its being treated as source material. |

## Steps

Every one of the 6 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Archive → greppable contents manifest**<br>`Task_Archive` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | NOT IMPLEMENTED. Tracked as a bean; see docs/document-ingestion.md. Tar/zip is opaque to every grep in the corpus until its contents are listed as data. |
| **File info, sizes, hashes, timestamps, mimetype**<br>`Task_TechMeta` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | NOT IMPLEMENTED. Tracked as a bean; see docs/document-ingestion.md. Mechanical and cheap; the checksum is what makes a remote asset verifiable. |
| **Narrative description per image, localized**<br>`Task_Image` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | NOT IMPLEMENTED. Tracked as a bean; see docs/document-ingestion.md. Applies equally to an image EXTRACTED FROM A PDF, not only to an uploaded one. |
| **Transcribe and translate audio**<br>`Task_Audio` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | NOT IMPLEMENTED. Tracked as a bean; see docs/document-ingestion.md. |
| **Sheet names, headers, shape, narrative**<br>`Task_Tabular` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | NOT IMPLEMENTED. Tracked as a bean; see docs/document-ingestion.md. CSV and spreadsheet: tabs, column and row headers, sizes, and what the dataset is about. |
| **Cite the author of every narrative**<br>`Task_Provenance` | Ingestion Engine (agent, runs unattended) | [`document-intake`](../reference/skill-instructions/document-intake.html) | A generated description is a claim by someone. Record whether a human or an agent wrote it, and for an agent the model version. An uncited narrative is indistinguishable from a transcription of the source. |

{% endraw %}
