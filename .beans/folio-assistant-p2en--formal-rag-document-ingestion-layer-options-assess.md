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

## Stage 1 built and run (scripts/pdf-structure.py)

Egress checked per the author's hunch: the MCP servers DO exist
(`qou/.mcp.json` has paper-search-mcp + openalex-paper-search) but
arxiv.org / export.arxiv.org / api.openalex.org all return 403 policy
denials. PyPI is reachable. So the offline PDF path had to be Stage 1,
not the network acquire — proposal §10 reordered accordingly.

Whole-corpus run: 339 PDFs / 12,166 pages -> 332 docs, 0 failures,
**7,313 sections / 24.7M chars greppable** (52 MB). Title 96.7% (vs
DocInfo 37%), authors 72.6%, abstract 68.4%, arXiv id 64.2% from the
page-1 stamp. TOC: 188 outline / 137 inferred / 7 none.

Residue that defines Stage 3: 7 no-TOC, 17 unsectioned, 7 likely-scanned.
Those ~20 are where Docling earns its place; the other 312 do not need it.

Next: Stage B extractors (candidates.json) — math claims -> formalization
candidates, WHO L1 -> recommendation blocks. Both propose, never write to
content/.

## Follow-ups landed (qou PR #5134)

- corpus-grep checklist gains path 5, `library/*/sections/` — the 24.7M
  chars are now reachable by the discipline that most needs them.
- 43 references.ts entries marked `stage: "missing"` (claimed upload,
  file never committed). Recorded, not repaired.
- 246 uncited library documents queued in
  `docs/audits/2026-08-15-library-uncited-triage.md`, ranked by extracted
  formalizable content (a proxy for offered material, NOT relevance).

## Stage 3 (Docling) is network-blocked, like Stage 2

huggingface.co and cdn-lfs.huggingface.co return the same 403 policy
denial as arxiv.org, and that is where Docling's layout/TableFormer/
formula models come from. So BOTH network-dependent stages are dead in a
sandbox, which is the strongest version of the argument for the
pypdf-only Stage 1. Stage 3 is a workstation/CI stage: run where egress
allows, commit artefacts, let sandboxed sessions consume them.

Work list is ~20 documents (7 no-TOC, 17 unsectioned, 7 scanned).
