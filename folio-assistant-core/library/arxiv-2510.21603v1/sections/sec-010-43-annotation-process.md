---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-010-43-annotation-process
section_title: "Annotation Process"
section_number: 4.3
pages: 5-5
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Our annotation process employs PhD/Master-level researchers with
extensive research experience to ensure benchmark quality. Beyond
basic question-answer pairs, we annotate six critical dimensions
that enable comprehensive evaluation of deep research systems:
• Hard Negative Documents: We carefully curate documents
that share topical similarity with target questions while lacking
essential information. This tests systems’ ability to distinguish
truly relevant sources from plausible distractors—a critical capa-
bility for effective document filtering in large collections.
• Retrieval Granularity: We label optimal information extraction
levels (full-text, summary, page, chunk) based on query charac-
teristics. For example, single-document summarization requires
full-text retrieval, while multi-document synthesis necessitates
summary or chunk retrieval due to context constraints. This
enables evaluation of adaptive granularity selection.
• Fine-grained Layout: Following MMDocIR [5], we annotate
both relevant pages and bounding boxes within those pages,
enabling precise evaluation at element levels.
• Subquery Decomposition: We provide ground-truth interme-
diate queries that reveal optimal decomposition strategies for
complex questions. Since deep research systems typically break
down questions iteratively, these annotations enable evaluation
of query planning and refinement capabilities.
• Answer Verification Checklists: For lengthy responses where
objective evaluation proves challenging, we develop structured
checklists with clear criteria for assessing answer completeness
and accuracy, enabling systematic LLM-based evaluation.
• Bilingual Support: All annotators are proficient in English and
Chinese, enabling annotation of questions and documents in both
languages to evaluate multilingual system capabilities.
To facilitate understanding on M4DocBench, we demonstrate
one annotation example in Figure 1 and two examples in Figure 4.
4.4
