---
# folio-assistant-p67i
title: 'INGEST: CSV and spreadsheet — sheet names, headers, shape, narrative'
status: in-progress
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T15:46:59Z
parent: folio-assistant-slw1
---

## What

For a CSV or spreadsheet, extract what makes a dataset findable rather than
merely stored: sheet/tab names, column and row headers, the shape (rows ×
columns per sheet), and a narrative description of what the data is about.

## Done when

`manifest.jsonld` carries a tabular record per sheet, the narrative carries its
provenance stamp, and a grep for a column header finds the dataset that has it.

Diagram: `skills/workflows/ingest-derive-content.bpmn`, `Task_Tabular`.

_2026-09-19T15:46:59Z_ — Claimed by claude/ecstatic-goldberg-eroyaz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
