---
# folio-assistant-8i57
title: 'Document ingestion page has no theme section: Process_IngestTheme is called but documented nowhere'
status: in-progress
type: task
priority: normal
created_at: 2026-09-24T17:22:04Z
updated_at: 2026-09-24T17:47:57Z
parent: folio-assistant-tr05
---

## Why
`document-ingestion.bpmn` calls `Process_IngestTheme` (`ingest-theme.bpmn`) behind `Gateway_ThemeSource`, and its links pointed at `#ingest-the-theme` and `#a-theme-source` — neither anchor exists. `content/docs/document-ingestion/document-ingestion.ts` has sections for extract / derive / build-KG / gate but none for the theme. Once links are derived from `asset.source` (B5-fix), the theme box falls back to the generated process page until this exists.

## Plan
Add a WebPage node `ingest-the-theme` (level 3, `asset.source: processes/ingest-theme.bpmn`) with prose on what a theme source is and why the gateway is answered by the ingesting person (the gateway's own documentation carries this).

## Done when
The theme subprocess box links to a prose section, and the page renders it.
