---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-018-56-parsing-and-deep-research-efficiency
section_title: "Parsing and Deep Research Efficiency"
section_number: 5.6
pages: 8-8
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Table 4 analyzes computational tradeoffs across parsing strategies
on M4DocBench’s 304 documents (6,177 pages, 4,146 figures, and
2,739 tables) and deep research latency on 158 questions.
Parsing Setting
Parsing Latency and Cost
Doc-Researcher Latency
Level
Type
Parse Index Caption Store
Plan Search Refine
Answer
free vision:dense
-
08:56
-
0.15
-
05:34 19:50:16 03:30:42
vision:multi
-
39:14
-
4.33
-
59:47 20:32:23 03:41:12
shal’ text:dense
18:47
09:50
-
0.37
-
10:31 03:29:37 01:57:32
deep text:dense
01:21:21 12:47 01:12:32 0.34 01:48:32 10:54 04:14:30 02:27:28
hybrid:dense 01:21:21 14:40 01:12:32 0.43 02:01:16 02:19 04:23:20 02:09:42
Table 4: Efficiency analysis on different parsing setting and
their effect on Doc-Researcher systems. The latency is
measured by HH:MM:SS and storage is in GB.
Parsing-time vs. Research-time Trade-off. Deep parsing re-
quires around 2.5h upfront: much slower than parsing-free (9-39m),
which primarily due to MinerU’s layout analysis and VLM-based
visual element transcription. However, this investment dramatically
reduces research-time latency. Parsing-free methods spend 80% of
inference time (20h) extracting information from raw screenshots,
while deep parsing completes the same tasks in 4h. This 5× speedup
during research validates that one-time multimodal transcription
is more efficient than repeated visual processing.
Storage and Embedding Considerations. Multi-vector embed-
dings consume 10-20× more storage and 4x more indexing time than
dense variants, reflecting the tradeoff between retrieval quality and
resource requirements. Note that multi-vector embedding storage
and similarity computation (maxsim in late interaction mechanism)
is not supported in current vector database, thus causing much
longer indexing and searching latency.
Research Phase Breakdown. For deep research workflows, la-
tency distributes across planning (2h), iterative search-refine loops
(4h), and answer generation (2h). The search-refine phase domi-
nates due to multiple retrieval rounds and evidence accumulation.
6
