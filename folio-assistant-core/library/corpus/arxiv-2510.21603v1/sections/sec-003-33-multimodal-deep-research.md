---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-003-33-multimodal-deep-research
section_title: "Multimodal Deep Research"
section_number: 3.3
pages: 3-3
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Figure 2: Doc-Researcher Architecture: (a) multimodal deep parsing and indexing, and (b) multimodal deep research.
Document RAG Systems. Due to limited context windows,
DocRAG systems have merged that decompose understanding
into retrieval and reasoning stages. Current systems [3, 6, 12]
employ various strategies: M3DocRAG uses vision-only page re-
trieval, MDocAgent combines text chunks with screenshots, and
VDocRAG [32] incorporates figure extraction. However, all perform
single-round retrieval with fixed granularities, lacking the iterative
refinement and adaptive strategies essential for complex research.
Doc-Researcher introduces the first deep research framework for
multimodal documents, enabling multi-step investigation through
dynamic granularity selection and progressive evidence synthesis.
3
