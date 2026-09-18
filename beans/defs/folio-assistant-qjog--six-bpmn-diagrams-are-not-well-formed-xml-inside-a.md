---
# folio-assistant-qjog
title: Six BPMN diagrams are not well-formed XML (-- inside a comment)
status: todo
type: task
created_at: 2026-09-18T22:25:44Z
updated_at: 2026-09-18T22:25:44Z
---


**Measured 2026-09-18**, on `main` (verified by stashing, so it is not this
branch's doing).

`document-ingestion.bpmn`, `evidence-retrieval.bpmn`,
`ingest-build-l1-kg.bpmn`, `ingest-derive-content.bpmn`,
`ingest-extract-structure.bpmn` and `ingest-l1-completeness-gate.bpmn` all
carry a `--` inside an XML comment, in the header line:

> by `bun run render:bpmn` -- never hand-edit the SVG.

XML 1.0 §2.5 forbids `--` within a comment. Python's expat rejects all six with
`not well-formed (invalid token)`.

**Why nothing has caught it.** `bpmn-moddle` is lenient and parses them, so
`kg:audit` reports `unknown 0` and every gate in the repo is green over them.
The audit is therefore telling the truth about what *this instance* can load,
and is silent about what anyone else can.

**Why it matters anyway.** Each of those six files' own header says: *"Open it
in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool."* A tool with a
conformant parser cannot open them. The file that is declared the source of
truth is unreadable by the tools it names.

## Done when

An em dash, a colon, or a single hyphen replaces the `--` in all six headers,
and a check refuses a `.bpmn` that a conformant parser rejects — so the next one
is caught rather than measured a year later. Cheapest form of the check is a
strict parse in `scripts/render-bpmn.ts --check`, which already reads every
diagram.
