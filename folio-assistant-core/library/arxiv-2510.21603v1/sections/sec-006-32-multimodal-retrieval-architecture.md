---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-006-32-multimodal-retrieval-architecture
section_title: "Multimodal Retrieval Architecture"
section_number: 3.2
pages: 3-4
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Vision-only Retrieval. Vision-only retrieval operates at page gran-
ularity using raw screenshots as encoded passages. This approach
eliminates parsing overhead, offering high efficiency without OCR
or layout analysis. However, it faces challenges in representing
complex interleaved text-vision content through dense vectors. For
high-resolution pages, multi-vector vision retrievers can produce
thousands of vectors, as each small image patch (typically 16x16 or
14x14 pixels) correspond to a vector. Additionally, vision retrievers
rely on parameter-heavy VLMs (often >3B parameters) with deeper
architectures, increasing computational costs.
xxx, June 03–05, 2018, Woodstock, NY
Dong et al.
Benchmarks
Question of multi-
QA
Annotation Type
Domain
lang’
Retrieval Annotation
hop modal doc turn
doc #doc page #page layout #lay subquery
ViDoRe [10]
✗
✓
✗
✗
3,810
Existing+Claude3
Multiple
2
✗
1.0
✓
1.0
✗
-
✗
MMLongBench-Doc [23]
✓
✓
✗
✗
1,082
Expert
7 domains
1
✗
1.0
✓
1.2
✗
-
✗
DocBench [46]
✓
✓
✗
✗
1,102
GPT4 + Human
5 domains
1
✗
1.0
✗
-
✗
-
✗
M3SciQA [16]
✗
✓
✗
✗
1,452
GPT-4 + Human
NLP papers
1
✓
2.0
✗
-
✗
-
✗
M3DocVQA [3]
✗
✓
✗
✗
2,441
Human
Wikipedia
1
✗
1.0
✓
1.4
✗
-
✗
ViDoSeek [41]
✓
✓
✗
✗
3,162
Human
Slide
1
✗
1.0
✓
1.0
✗
-
✗
MMDocIR [5]
✓
✓
✗
✗
1,658
Expert
10 domains
1
✗
1.0
✓
1.5
✓
1.8
✗
ViDoRe-v2 [24]
✓
✓
✓
✗
271
GPT-4o + Human
ESG/Bio/Eco
4
✗
1.0
✓
5.1
✗
-
✗
MMDocRAG [6]
✓
✓
✗
✗
4,055
GPT-4o + Human
10 domains
1
✗
1.0
✓
1.4
✓
1.7
✗
Double-Bench [29]
✓
✓
✗
✗
5,168
KG+GPT-4o+Human
Multiple
6
✗
1.0
✓
5.9
✗
-
✓
M4DocBench
✓
✓
✓
✓
158
Expert
4 domains
2
✓
3.8
✓
7.0
✓
14.8
✓
Table 1: M4DocBench compared to other Document RAG/VQA dataset.
Text-only Retrieval. Text-only retrieval supports both page
and chunk granularities, encoding OCR-extracted text, text chunks,
and VLM-generated descriptions of visual elements. This approach
leverages lightweight models (often <1B parameters) that excel
at encoding text-intensive documents. However, generating VLM
descriptions incurs preprocessing costs and may lose critical visual
semantics during textual conversion.
Hybrid Retrieval. Hybrid retrieval combines strengths of both
paradigms by directly encoding visual chunks and page screenshots
without intermediate textual conversion, preserving rich visual in-
formation while maintaining text understanding capabilities. This
approach eliminates information loss from OCR or VLM descrip-
tion but requires more computational resources during inference.
The trade-off between retrieval quality and efficiency depends on
specific application requirements and document characteristics.
3.3
Multimodal Deep Research
Strategic Document Filtering and Adaptive Processing. Given
a query 𝑞𝑖with dialog history ℎ𝑖, the Planner agent addresses
computational efficiency in large-scale document analysis through
intelligent document selection and determining retrieval granu-
larity. The agent analyzes (𝑞𝑖,ℎ𝑖) to produce three outputs: (i) a
filtered document subset D′ ⊆D by matching query semantics
against document summaries, reducing search space by 60-80%
while maintaining high recall; (ii) optimal retrieval granularity
𝜃∈𝐺= {summary, chunk, full, summary} based on query charac-
teristics; and (iii) refined sub-queries at timestamp𝑄𝑡= { ˜𝑞1, . . . , ˜𝑞𝑛}
that decompose complex questions or explore in new search direc-
tions. This adaptive strategy leverages the multi-granular repre-
sentations from our parsing framework (§3.1). For instance, broad
contextual queries activate summary mode to access document
overviews directly, while technical queries that require specific
evidence trigger targeted chunk extraction through iterative refine-
ment.
Iterative Search-Refine Loop. The core research process oper-
ates through dynamic collaboration between Searcher and Refiner.
For each sub-query ˜𝑞𝑘∈𝑄𝑡, the system executes an iterative loop:
R𝑡= Search( ˜𝑞𝑘, D′,𝜃),
R∗
𝑡= Refine(R𝑡, ˜𝑞𝑘)
(1)
𝜎𝑡= Evaluate(R∗
1 ∪. . . ∪R∗
𝑡,𝑞𝑖)
(2)
where R𝑡represents content retrieved at iteration 𝑡using our multi-
modal retrieval architecture (§3.2), R∗
𝑡is the refined relevant subset
after deduplication and relevance filtering, and 𝜎𝑡measures in-
formation sufficiency. The loop continues until either sufficiency
threshold is met (𝜎𝑡≥𝜏) or maximum iterations reached (𝑡= 𝑇max),
balancing thoroughness with computational efficiency. If a new
loop is required, the collection of subqueries is updated concur-
rently (𝑄𝑡→𝑄𝑡+1) for the next iteration.
Multimodal Report Generation. The Reporter synthesizes ac-
cumulated evidence R∗= Ð
𝑡R∗
𝑡into a comprehensive response
ˆ𝑎= Report(𝑞𝑖, R∗, C), where C contains citation metadata (page
IDs and bounding boxes coordinates) from our parsing framework.
By analyzing query intent and retrieved information, the Reporter
generates interleaved text-image outputs that directly incorporate
relevant visual elements (e.g., tables, figures, and charts) alongside
textual explanations. This supports the notion that “a single image
is worth a thousand words”. Moreover, the multimodal composi-
tion enhances both answer quality and verifiability, as users can
directly verify claims to precise document locations via embedded
multimodal citations. The approach proves particularly effective
for complex analytical queries requiring evidence synthesis across
diverse multimodal sources.
4
