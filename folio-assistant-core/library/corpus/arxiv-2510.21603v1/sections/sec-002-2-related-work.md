---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-002-2-related-work
section_title: "Related Work"
section_number: 2
pages: 2-3
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Our work builds upon three research directions that collectively
define the landscape of multimodal document understanding.
Document Parsing Strategies. Document parsing approaches
fall into three categories, each with distinct tradeoffs. Shallow
parsing relies on OCR to extract text while discarding spatial and
visual information [31]. Deep parsing systems like MinerU [39]
preserve layout structure through bounding boxes, transcribe equa-
tions to LaTeX [38], and convert tables to structured formats [42].
Recent VLM-based parsers [21, 27] further enhance extraction
quality. Parsing-free approaches [10, 22] bypass parsing entirely,
processing documents as page screenshots. While avoiding pars-
ing overhead, they sacrifice fine-grained localization and struggle
with dense text. Our deep parsing framework synthesizes these ap-
proaches’ strengths: preserving visual semantics like parsing-free
methods while maintaining structural precision of deep parsing.
Visual Document Understanding. DocVQA benchmarks evolve
from single-page tasks [25, 26] to multi-hop reasoning across pages
[15, 36] and recently to long documents [23, 46]. However, these
benchmarks evaluate isolated capabilities: either VLM long-context
processing (1-20 images) or single-document QA (50+ pages). Cru-
cially, none assess multi-document synthesis, multi-turn interac-
tion, or evidence chain annotation needed for research-level tasks.
Hence, we propose M4DocBench (Section 4) to address these gaps
with comprehensive deep research evaluation.
Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research
xxx, June 03–05, 2018, Woodstock, NY
Retrieval Granularites
- full-text? Summary? Chunk?
Multimodal
Documents
Text
Image
Table
Equation
Image
Description
Table
Description
Table
Markdown
Equation
Latex
Strutured
full-text
Layout-
aware
chunks
Summary
Layout
Parsing
Page Screenshots
Visual/Text Embed
Visual Embed
Parsing
Free
Multi-Granular
Documents
What is deep research?
Help me summarize these 20
documents
Compare the coverage of
existing policies
Intent Understanding
Need chunk/page retrieval
Need summay of 20 docs and
chunk/page retrieval
Need full-text of relevant
docs and chunk retrieval
Adaptive & Multi-granular Retrieval
Report
Generation
Multi-round
Info Gathering
Doc
Researcher
User
Vector/Relational
Database
(a) Offline Stage: Deep Document Parsing and Indexing
Documents
Collections
Relevant
Documents
- xxxx.pdf
- xxxx.pdf
....
Sub-queries
- query 1
- query 2
- query 3
....
Planner
full-text 1,2,3...
Chunks 1,2,3...
Summary 1,2,3...
Are these useful
and related?
Yes
+
Searcher
Refiner
Reporter
Iterative
Check if it is
sufficient?
Yes
No
New Queries
User Query
Conversation
History
