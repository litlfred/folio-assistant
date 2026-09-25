---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-000-abstract
section_title: "Abstract"
section_number: null
pages: 1-1
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Deep Research systems have revolutionized how LLMs solve com-
plex questions through iterative reasoning and evidence gathering.
However, current systems remain fundamentally constrained to
textual web data, overlooking the vast knowledge embedded in mul-
timodal documents: scientific papers, technical reports, and finan-
cial documents where critical information exists in figures, tables,
charts, and equations. Processing such documents demands sophis-
ticated parsing to preserve visual semantics, intelligent chunking to
maintain structural coherence, and adaptive retrieval across modal-
ities, which are capabilities absent in existing systems. In response,
we present Doc-Researcher, a unified system that bridges this
gap through three integrated components: (i) deep multimodal
parsing that preserves layout structure and visual semantics while
creating multi-granular representations from chunk to document
level, (ii) systematic retrieval architecture supporting text-only,
vision-only, and hybrid paradigms with dynamic granularity selec-
tion, and (iii) iterative multi-agent workflows that decompose
complex queries, progressively accumulate evidence, and synthesize
comprehensive answers across documents and modalities. To enable
rigorous evaluation, we introduce M4DocBench, the first bench-
mark for Multi-modal, Multi-hop, Multi-document, and Multi-turn
deep research. Featuring 158 expert-annotated questions with com-
plete evidence chains across 304 documents, M4DocBench tests
capabilities that existing benchmarks cannot assess. Experiments
demonstrate that Doc-Researcher achieves 50.6% accuracy, 3.4×
better than state-of-the-art baselines, validating that effective docu-
ment research requires not just better retrieval, but fundamentally
deep parsing that preserve multimodal integrity and support itera-
tive research. Our work establishes a new paradigm for conducting
deep research on multimodal document collections.
CCS Concepts
• Information systems →Multimodal Deep Research.
Keywords
Multimodal Document Parsing, Deep Research, Agentic RAG
Permission to make digital or hard copies of all or part of this work for personal or
classroom use is granted without fee provided that copies are not made or distributed
for profit or commercial advantage and that copies bear this notice and the full citation
on the first page. Copyrights for components of this work owned by others than the
author(s) must be honored. Abstracting with credit is permitted. To copy otherwise, or
republish, to post on servers or to redistribute to lists, requires prior specific permission
and/or a fee. Request permissions from permissions@acm.org.
xxx, Woodstock, NY
© 2018 Copyright held by the owner/author(s). Publication rights licensed to ACM.
ACM ISBN 978-1-4503-XXXX-X/2018/06
https://doi.org/XXXXXXX.XXXXXXX
ACM Reference Format:
Kuicai Dong∗, Shurui Huang∗, Fangda Ye∗, Wei Han, Zhi Zhang, Dexun Li,
Wenjun Li, Qu Yang, Gang Wang, Yichao Wang, Chen Zhang, Yong Liu. 2018.
Doc-Researcher: A Unified System for Multimodal Document Parsing and
Deep Research. In Proceedings of xxx. ACM, New York, NY, USA, 13 pages.
https://doi.org/XXXXXXX.XXXXXXX
1
