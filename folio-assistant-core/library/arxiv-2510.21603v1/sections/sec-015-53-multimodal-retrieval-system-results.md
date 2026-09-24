---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-015-53-multimodal-retrieval-system-results
section_title: "Multimodal Retrieval System Results"
section_number: 5.3
pages: 7-7
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Table 2 presents retrieval performance across different paradigms
on M4DocBench and MMDocIR, evaluating both original questions
and decomposed sub-queries. Fine-grained results are in Figure 7.
Retrieval Paradigm Comparison. Text-only retrieval shows
hierarchical performance: sparse retrieval (BM25) performs worst,
while dense retrievers (BGE-M3, Qwen3-Embedding) achieve sub-
stantial improvements. Vision-only retrieval, Jina-embedding-v4,
even its dense variant, outperform other multi-vector models. Note
that vision-only retrieval excels text-only method on MMDocIR’s
visual-centric tasks but underperforms on M4DocBench’s complex
multi-document scenarios. Critically, hybrid retrieval consistently
outperforms single-modality approaches. For instance, combining
Qwen3-Embedding with Jina-embedding-v4 improves page recall
by 8-12% over either method alone, demonstrating that heteroge-
neous retrieval leverages complementary modality strengths.
Sub-query Decomposition Impact. Query decomposition sub-
stantially enhances retrieval across all paradigms. Qwen3-Embedding’s
page-level recall improves from 42.1% to 49.9% (k=15) with sub-
queries, while hybrid methods show similar gains. This confirms
that iterative sub-query refinement can effectively chains evidence
across documents and modalities, particularly crucial for multi-hop
reasoning tasks.
Granularity-Performance Tradeoff. Performance degrades
significantly with finer granularity: document-level recall exceeds
70% for hybrid methods, but page- and layout-level recall drop
by 30-40%. This indicates that coarse-grained tasks are relatively
easy to satisfy, whereas fine-grained retrieval task requires more
adaptive and multi-granular retrieval strategies.
5.4
