---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-005-31-deep-multimodal-document-parsing
section_title: "Deep Multimodal Document Parsing"
section_number: 3.1
pages: 3-3
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Multi-modal Doc Parsing. Given a collection of multimodal doc-
uments D, each document 𝑑𝑖∈D undergoes layout-aware parsing
via MinerU [39] to extract structural elements 𝐸𝑖= {𝑒𝑖,𝑗,𝑘}, where
indices denote document 𝑖, page 𝑗, and reading sequence 𝑘. Each el-
ement is pair with its layout type (text, table, figure, equation), and
bounding box coordinates (Figure 5a). For computational efficiency,
we perform one-time textual conversion of visual elements. Tables
and figures are processed through Qwen2.5-VL [1] to generate both
coarse-grained summaries for contextual understanding and fine-
grained descriptions for detailed content capture. Equations are
converted to LaTeX format using UniMERNet [38]. This preprocess-
ing strategy enables efficient retrieval and reasoning operations
while avoiding repeated multimodal token processing.
Multi-granular Doc Chunking. While individual layout ele-
ments 𝐸𝑖preserve structural integrity, they often lack sufficient con-
text. We address this through layout-aware chunking that merges
text elements within section boundaries, subject to maximum length
constraints (Figure 5b). This strategy maintains semantic coherence
while preserving full traceability via page IDs and bounding box
coordinates for precise localization and citation. We construct 4
different granularity levels 𝐺= {chunk, page, full, summary}: (1)
chunks created through layout-aware merging, (2) pages by either
combining all elements 𝑒𝑖,𝑗,· within page 𝑗, or raw page screenshots,
(3) full-text containing all elements within document 𝑑𝑖, and (4) doc-
ument summary is obtained by summarizing full-text of document
𝑑𝑖using LLMs.
3.2
