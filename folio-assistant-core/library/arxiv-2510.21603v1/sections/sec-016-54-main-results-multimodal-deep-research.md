---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-016-54-main-results-multimodal-deep-research
section_title: "Main Results: Multimodal Deep Research"
section_number: 5.4
pages: 7-8
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Table 3 validates our core contributions via systematic comparisons.
Deep Research can largely improve multimodal understand-
ing. Direct answering achieves only 5-10%; long-context processing
ranges within 9-31% despite document content of 96k tokens is
given. Results show that neither parametric knowledge nor brute-
force context extension can handle research-level complexity. In
comparison, Doc-Researcher with multi-agent framework (with
strategic planning, iterative search-refine loops, and progressive
evidence accumulation) achieves score of 50.6%. The 20-40% gap
over long-context proves that deep research needs fundamentally
multi-agent workflows, not just more context.
Deep Parsing Outperforms Simplistic Parsing. Relying on
shallow parsing, Doc-Researcher achieves 34-39% accuracy, which
is worse than using parsing-free screenshot processing (36-43%).
This confirms that simplistic OCR destroys visual semantics. Doc-
Researcher equipped with deep parsing and hybrid retrieval, which
preserves layout and multimodal characteristics, reaches 42-50%.
The 10% absolute gain validates that modality-specific preservation
via deep parsing is essential for document understanding.
Iterative Workflows Enable Deep Research. Baseline RAG
systems fail due to single-round and rigid retrieval: MDocAgent
(15.8%) cannot adaptively select strategies despite using dual modal-
ities; M3DocRAG (7.0%) and ColQwen-gen (5.7%) are limited to
xxx, June 03–05, 2018, Woodstock, NY
Dong et al.
1
2
3
4
5
40
50
+7.2%
+9.7%
+11.1%
Accuracy (%)
1
2
3
4
5
10
15
Accumulated Chunks
Qwen3-32B
Qwen3-235B
DeepSeek-R1
1
2
3
4
5
70
80
Doc Recall (%)
1
2
3
4
5
40
50
60
Page Recall (%)
1
2
3
4
5
30
40
Layout Recall (%)
Figure 3: Performance with increasing search depth.
page-level vision retrieval. In contrast, Doc-Researcher achieves
50.6% which is 3.4× better than MDocAgent, as it allows for the
dynamic decomposition and refinement of queries over multiple
steps, enabling the multi-hop reasoning and evidence synthesis.
5.5
