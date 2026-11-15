---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-014-52-system-setting-and-baselines
section_title: "System Setting and Baselines"
section_number: 5.2
pages: 6-7
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Retrieval System. We evaluate 10 retrievers to implement our
multimodal retrieval architecture (§3.2): 5 Text retrievers: BM25
[28], E5 [40], BGE-M3 [2], Qwen3-embedding-0.6B [45], and Qwen3-
reranker-0.6B [45]. 5 Vision retrievers: DSE [22], ColPali [10],
ColQwen [10], and Jina-embedding-v4 [11] (multi-vector and dense
variants). We configure these retrievers in three paradigms: (1)
Text-only: Text retrievers encode both textual and visual chunks,
with visual elements represented through VLM descriptions. (2)
Vision-only: Vision retrievers directly retrieve page screenshots
without parsing. (3) Hybrid: Text retrievers encode textual chunks
while vision retrievers encode visual chunks, leveraging modality-
specific strengths. For multi-query (decomposing original question
3https://github.com/MMDocRAG/MMDocIR
into multiple subqueries) aggregation, we employ Qwen3-reranker-
0.6B for text retrieval reranking. For vision and hybrid retrieval,
we accumulate equal passages per sub-query due to the absence of
robust multimodal rerankers.
Doc-Researcher Configurations. Doc-Researcher is imple-
mented with three parsing levels (§3.1), all using the same backbone
LLM (Qwen3-32B [35], Qwen3-235B [35], DeepSeek-R1 [4]) but dif-
fering in document representation: (1) Parsing-free: Direct page
screenshot processing, requiring additional VLMs (InternVL3.5-
38B [34]) for information extraction from retrieved images. (2) Shal-
low Parsing: OCR-extracted text split into fixed-length chunks
without structural awareness. (3) Deep Parsing: Layout-aware
chunks with multimodal elements transcribed via VLM, preserving
document structure and semantics.
Baseline Systems. We compare Doc-Researcher against non-
RAG and state-of-the-art document RAG systems: (1) Direct: LLM
responses without document context, testing parametric knowl-
edge. (2) Long-context: Full documents provided as context (trun-
cated at 96k tokens), testing long-context understanding based on
Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research
xxx, June 03–05, 2018, Woodstock, NY
Method
Backbone
Retriever
Parsing
Accuracy
Doc Selection
Retrieval Recall
Level
All
en
zh
ins’
res’
edu’
fin’
Rec
Prec
F1
Doc
Page
Lay’
#psg
Direct
Qwen3-32B
-
-
7.0
3.8
10.1
8.3
10.3
0.0
5.6
-
-
-
-
-
-
-
Direct
Qwen3-235B
-
-
5.1
5.1
5.1
4.2
7.4
3.3
2.8
-
-
-
-
-
-
-
Direct
DeepSeek-R1
-
-
10.1
13.9
6.3
20.8
11.8
10.0
0.0
-
-
-
-
-
-
-
Long-context
Qwen3-32B
-
Shallow
13.3
19.0
7.6
25.0
20.6
0.0
2.8
-
-
-
-
-
-
-
Long-context
Qwen3-235B
-
Shallow
8.9
5.1
12.7
12.5
14.7
3.3
0.0
-
-
-
-
-
-
-
Long-context
DeepSeek-R1
-
Shallow
29.1
29.1
29.1
20.8
47.1
20.0
8.3
-
-
-
-
-
-
-
Long-context
Qwen3-32B
-
Deep
13.3
12.7
13.9
20.8
22.1
3.3
0.0
-
-
-
-
-
-
-
Long-context
Qwen3-235B
-
Deep
11.4
7.6
15.2
16.7
19.1
3.3
0.0
-
-
-
-
-
-
-
Long-context
DeepSeek-R1
-
Deep
31.7
34.2
29.1
33.3
45.6
30.0
5.6
-
-
-
-
-
-
-
MDocAgent
InternVL3.5-38B
Hyribd (Multi)♥
Shallow
15.8
19.0
12.7
20.8
23.5
6.7
5.6
-
-
-
74.22
37.54
-
10
M3DocRAG
InternVL3.5-38B
Vision (ColPali)
Free
7.0
10.1
3.8
4.2
2.9
26.7
0.0
-
-
-
69.58
34.35
-
10
Colqwen-gen
InternVL3.5-38B
Vision (ColQwen)
Free
5.7
6.3
5.1
0.0
8.8
10.0
0.0
-
-
-
74.38
46.29
-
10
Doc-Researcher
Qwen3-32B♣
Vision (Jina)
Free
36.7
34.2
39.2
20.8
52.9
40.0
13.9
-
-
-
88.9
61.3
-
17.9
Doc-Researcher
Qwen3-235B♣
Vision (Jina)
Free
36.7
36.7
36.7
29.2
50.0
40.0
13.9
-
-
-
89.0
61.0
-
17.9
Doc-Researcher
DeepSeek-R1♣
Vision (Jina)
Free
43.7
45.6
41.7
37.5
61.8
43.3
13.9
-
-
-
90.6
63.6
-
17.4
Doc-Researcher
Qwen3-32B
Text (Multi)♠
Shallow
34.2
37.9
30.4
12.5
55.9
36.7
5.6
-
-
-
88.2
59.8
-
14.7
Doc-Researcher
Qwen3-235B
Text (Multi)♠
Shallow
36.1
35.4
36.7
12.5
54.4
46.7
8.3
-
-
-
88.2
60.5
-
14.7
Doc-Researcher
DeepSeek-R1
Text (Multi)♠
Shallow
39.2
34.2
44.3
20.8
57.4
50.0
8.3
-
-
-
87.5
61.1
-
14.5
Doc-Researcher
Qwen3-32B
Text (Multi)♠
Deep
39.2
41.8
36.7
20.8
64.7
26.7
13.9
84.2
75.9
76.0
80.8
59.7
35.1
14.2
Doc-Researcher
Qwen3-235B
Text (Multi)♠
Deep
45.6
43.0
48.1
41.7
63.2
50.0
11.1
88.0
77.0
78.4
82.9
60.6
37.7
14.8
Doc-Researcher
DeepSeek-R1
Text (Multi)♠
Deep
45.6
44.3
46.8
33.3
67.7
46.7
11.1
89.0
79.1
79.8
82.6
59.2
38.7
12.9
Doc-Researcher
Qwen3-32B
Hybrid (Jina)
Deep
42.4
43.0
41.8
20.8
70.6
33.3
11.1
87.0
78.1
78.8
83.2
59.4
43.1
17.2
- w/o planner
Qwen3-32B
Hybrid (Jina)
Deep
36.7
39.2
35.4
29.2
50.0
40.0
11.1
-
-
-
85.7
58.1
40.5
14.5
Doc-Researcher
Qwen3-235B
Hybrid (Jina)
Deep
47.5
46.8
48.1
41.7
64.7
53.3
13.9
86.7
79.1
79.4
82.2
61.2
45.7
15.8
- w/o planner
Qwen3-235B
Hybrid (Jina)
Deep
39.2
35.4
43.0
26.7
57.4
43.3
13.9
-
-
-
88.0
58.2
41.2
13.9
Doc-Researcher
DeepSeek-R1
Hybrid (Jina)
Deep
50.6
53.2
48.1
45.8
70.6
56.7
11.1
89.5
77.4
78.6
82.9
58.0
41.0
14.1
- w/o planner
DeepSeek-R1
Hybrid (Jina)
Deep
42.9
44.0
41.8
31.2
61.7
43.3
8.3
-
-
-
84.2
55.3
38.8
13.6
Table 3: Main results on M4DocBench. The best score is in boldface and colored and second best is underlined. ♥means BGE-M3
that for text retrieval and ColQwen for page retrieval. ♠refers to using Qwen3-embed, BGE-M3, and E5 for text retrieval. ♣
indicates using InternVL3.5-38B to extract relevant information from raw screenshots, as LLM backbones cannot read images.
both shallow and deep parsed documents. (3) MDocAgent [12]:
Multi-agent pipeline processing top-5 text text chunks (BGE-M3)
and top-5 page screenshots (ColQwen). (4) M3DocRAG [3]: Multi-
modal input combining query with top-10 ColPali-retrieved page
screenshots. (5) ColQwen-gen [10]: Identical to M3DocRAG but
using ColQwen retriever.
5.3
