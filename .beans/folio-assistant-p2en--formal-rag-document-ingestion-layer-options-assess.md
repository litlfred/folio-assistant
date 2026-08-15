---
# folio-assistant-p2en
title: 'Formal RAG document-ingestion layer: options assessment + integration contract'
status: in-progress
type: task
priority: normal
created_at: 2026-08-15T15:27:40Z
updated_at: 2026-08-15T15:31:11Z
---


## Assessment landed (PR #119)

`docs/proposals/rag-document-ingestion.md`. Three measured constraints
decided it: 230/339 uploads (68%) are arXiv (source beats OCR); host is
cx23 = 2 vCPU/4 GB vs RAGFlow's 16 GB minimum (no co-hosting); and
`content/**` is already semantically chunked with a `uses[]` graph (a RAG
engine would hold a weaker second copy).

Recommends acquire → parse (Docling) → route-by-class → index (LanceDB,
embedded), with generic RAG as the *fallback* rather than the front door.
For WHO L2 DAK the generic-first ordering is destructive — BPMN/DMN/Excel
have structured extractors in `smart-base` already.

Next: author picks a stage to build (§10) and answers §11 Q1–Q3.
