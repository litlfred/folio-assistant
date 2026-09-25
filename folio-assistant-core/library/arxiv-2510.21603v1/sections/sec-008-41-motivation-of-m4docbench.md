---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-008-41-motivation-of-m4docbench
section_title: "Motivation of M4DocBench"
section_number: 4.1
pages: 4-5
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Existing evaluation benchmarks fail to capture the complexity of
multimodal document deep research. A comprehensive evaluation
must assess four critical dimensions: (1) Multi-hop reasoning:
Complex questions requiring sophisticated reasoning chains across
evidence. (2) Multi-modal integration: Questions demanding
information from at least two modalities (text, tables, images). (3)
Multi-document synthesis: Questions relying evidence from mul-
tiple documents, where each document provides unique, essential
information. Distractor documents with topically related content
increase retrieval difficulty. (4) Multi-turn interaction: Dialogi-
cal contexts reflecting real-world research sessions, where current
queries require information and disambiguation of prior exchanges.
Table 1 reveals critical gaps in existing benchmarks. While most
DocVQA/RAG datasets incorporate multi-hop and multi-modal
evidence, only one includes genuine multi-document reasoning.1
Most critically, the limited evidence scope (averaging fewer than 2
pages per question) indicates relatively simple and localized queries
rather than comprehensive research tasks. Also, only 2 existing
1Datasets that merely add noise documents to single-document VQA questions without
proper de-contextualization do not constitute true multi-document settings.
Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research
xxx, June 03–05, 2018, Woodstock, NY
benchmarks offer layout-level evidence localization. Furthermore,
no existing benchmark provides multi-turn conversational evalua-
tion. To address these limitations, we introduce M4DocBench, a
benchmark specifically designed for Multi-modal, Multi-hop, Multi-
document, and Multi-turn deep research evaluation. M4DocBench
features expert-annotated question-answer pairs with complete
evidence chains, enabling rigorous assessment of document under-
standing capabilities in realistic research scenarios.
4.2
