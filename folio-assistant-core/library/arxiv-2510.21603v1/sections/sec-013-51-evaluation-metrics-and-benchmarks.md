---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-013-51-evaluation-metrics-and-benchmarks
section_title: "Evaluation Metrics and Benchmarks"
section_number: 5.1
pages: 5-6
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Multimodal Retrieval Evaluation. We evaluate retrieval per-
formance at three granularities aligned with our retrieval frame-
work (§3.2): document, page, and layout. For each granularity, we
compute recall@k by comparing retrieved passages2 against gold
annotations. Document and page recall are computed using exact ID
matching. For chunk-level evaluation, following Dong et al. [5], we
calculate recall based on bounding box overlap between retrieved
and gold-standard layouts. Note that parsing-free methods cannot
be evaluated at chunk granularity.
Deep Research Evaluation. We evaluate the complete deep
research workflow (§3.3) across three dimensions: (1) Document
Selection: We assess the Planner’s ability to filter relevant docu-
ments from noisy collections, computing precision, recall, and F1
scores against gold document sets. (2) Agentic Retrieval: After it-
erative search-refine loops, we evaluate the quality of accumulated
relevant passages using the same metrics as multimodal retrieval,
but with variable passage counts reflecting the system’s adaptive
selection. (3) Answer Accuracy: Using LLM-as-judge with anno-
tated checklists K = {𝐾1, 𝐾2, ..., 𝐾𝑚}, we verify whether each atomic
fact appears in response ˆ𝑎. Answers are marked correct only when
all checklist items are satisfied.
Evaluation Benchmarks. We employ two benchmarks: (1)
M4DocBench (§4) for comprehensive evaluation of both mul-
timodal retrieval and deep research capabilities across multi-hop,
2Passages denote the minimal retrieval units: chunks for parsed methods, pages for
parsing-free approaches.
xxx, June 03–05, 2018, Woodstock, NY
Dong et al.
Model
Para-
Embed
M4DocBench
MMDocIR
meter
type
dimension
doc
page
layout
page
layout
Recall@𝑘= 10
Text
BM25
-
sparse
-
51.5 / 59.3
22.1 / 25.6
15.8 / 17.1
60.0 / 65.0
45.1 / 48.8
E5
0.34B
dense
1,024
65.7 / 75.4
29.9 / 31.8
18.0 / 18.0
54.4 / 61.3
38.0 / 44.8
BGE-M3
0.56B
dense
1,024
75.4 / 81.4
33.3 / 40.0
19.2 / 20.8
58.0 / 61.9
41.3 / 44.9
Qwen3-embedding
0.60B
dense
1,024
73.6 / 78.8
34.6 / 40.6
20.1 / 23.5
58.6 / 62.6
42.6 / 45.6
Multi+reranking∗
1.5B
hyrbid
-
78.7 / 80.3
39.2 / 40.9
23.1 / 21.1
65.5 / 66.7
48.6 / 49.4
Vision
DSEwiki−ss
4.15B
dense
3,072
34.8 / 42.4
11.1 / 11.7
-
68.4 / 68.7
-
ColPali
2.92B
multi
𝑁tok×128
47.7 / 50.0
18.1 / 17.9
-
75.4 / 73.9
-
ColQwen
2.21B
multi
𝑁tok×128
49.8 / 55.8
25.5 / 24.2
-
77.4 / 75.4
-
Jina-embedding-v4
3.75B
dense
2,048
52.9 / 56.3
23.6 / 22.9
-
74.4 / 71.5
-
Jina-embedding-v4
3.75B
multi
𝑁tok×128
54.3 / 58.7
25.8 / 26.7
-
80.8 / 79.4
-
Hyb’d
Jina-embedding-v4
3.75B
dense
2,048
74.0 / 79.4
39.1 / 40.5
28.7 / 27.9
83.4 / 84.0
66.1 / 65.8
Qwen3 + Jina
0.60/3.75B dense 1,024/2,048
74.0 / 79.6
37.5 / 37.5
28.1 / 26.9
82.9 / 83.3
65.4 / 64.7
BGE-M3 + Jina
0.56/3.75B dense 1,024/2,048
77.1 / 81.8
38.4 / 39.1
28.1 / 27.5
83.7 / 83.9
66.2 / 66.0
Recall@𝑘= 15
Text
BM25
-
sparse
-
58.1 / 66.3
28.0 / 32.6
20.3 / 22.9
62.4 / 68.0
46.8 / 52.2
E5
0.34B
dense
1,024
75.4 / 81.9
35.3 / 41.7
22.1 / 25.2
58.0 / 64.4
41.2 / 48.0
BGE-M3
0.56B
dense
1,024
83.3 / 87.6
41.2 / 46.8
23.8 / 24.9
61.4 / 64.8
44.4 / 47.9
Qwen3-embedding
0.60B
dense
1,024
81.1 / 86.8
42.1 / 49.9
25.4 / 27.4
61.4 / 65.3
45.2 / 48.3
Multi+reranking∗
1.5B
hyrbid
-
83.6 / 87.2
44.8 / 49.4
27.4 / 27.9
67.9 / 70.1
51.0 / 53.0
Vision
DSEwiki−ss
4.15B
dense
3,072
45.2 / 53.9
18.1 / 18.5
-
78.0 / 78.5
-
ColPali
2.92B
multi
𝑁tok×128
55.7 / 61.7
24.7 / 24.9
-
82.0 / 80.9
-
ColQwen
2.21B
multi
𝑁tok×128
60.6 / 69.4
33.8 / 33.3
-
83.1 / 82.9
-
Jina-embedding-v4
3.75B
dense
2,048
64.7 / 70.9
32.2 / 33.0
-
80.3 / 79.4
-
Jina-embedding-v4
3.75B
multi
𝑁tok×128
66.0 / 74.4
35.2 / 38.8
-
85.8 / 84.7
-
Hyb’d
Jina-embedding-v4
3.75B
dense
2,048
83.6 / 87.6
49.2 / 49.9
35.6 / 35.2
87.9 / 87.9
70.6 / 70.5
Qwen3 + Jina
0.60/3.75B dense 1,024/2,048
83.9 / 86.5
46.0 / 47.3
33.5 / 33.7
87.0 / 87.3
69.7 / 69.3
BGE-M3 + Jina
0.56/3.75B dense 1,024/2,048
84.1 / 87.0
44.9 / 47.1
33.4 / 34.1
88.5 / 88.1
70.9 / 70.4
Recall@𝑘= 20
Text
BM25
-
sparse
-
61.3 / 69.3
30.2 / 36.3
22.1 / 24.8
64.5 / 65.3
48.9 / 49.5
E5
0.34B
dense
1,024
79.4 / 85.1
39.4 / 47.5
25.6 / 29.0
60.1 / 66.4
43.3 / 49.7
BGE-M3
0.56B
dense
1,024
86.6 / 89.9
46.8 / 52.3
27.3 / 28.7
62.8 / 67.0
45.5 / 49.8
Qwen3-embedding
0.60B
dense
1,024
84.9 / 90.6
47.2 / 56.0
30.5 / 30.4
63.5 / 66.9
47.0 / 50.2
Multi+reranking∗
1.5B
hyrbid
-
87.8 / 90.3
50.6 / 56.3
31.9 / 32.3
70.1 / 71.7
53.5 / 54.9
Vision
DSEwiki−ss
4.15B
dense
3,072
52.5 / 59.5
23.3 / 23.5
-
83.1 / 83.8
-
ColPali
2.92B
multi
𝑁tok×128
61.5 / 67.8
29.5 / 30.0
-
86.0 / 85.6
-
ColQwen
2.21B
multi
𝑁tok×128
67.8 / 77.0
40.0 / 40.9
-
86.8 / 86.9
-
Jina-embedding-v4
3.75B
dense
2,048
73.0 / 78.2
39.7 / 41.3
-
84.6 / 84.0
-
Jina-embedding-v4
3.75B
multi
𝑁tok×128
70.9 / 80.5
42.1 / 46.3
-
88.9 / 88.4
-
Hyb’d
Jina-embedding-v4
3.75B
dense
2,048
88.6 / 89.9
55.5 / 56.5
40.9 / 40.6
90.0 / 90.7
73.4 / 73.6
Qwen3 + Jina
0.60/3.75B dense 1,024/2,048
87.2 / 90.1
53.1 / 54.5
39.4 / 39.7
89.8 / 89.7
72.2 / 72.5
BGE-M3 + Jina
0.56/3.75B dense 1,024/2,048
88.2 / 89.9
50.9 / 53.8
38.4 / 39.5
90.7 / 90.7
73.7 / 73.9
Table 2: Main results for evaluating retrieval performance. Each score pair (𝑠1/𝑠2) are calculated using original question /
decomposed sub-queries for retrieval. For ∗retrieval, we use multiple text retrievers (BM25, BGE-M3, Qwen3-embedding) to get
chunks and subsequently reranked by Qwen3-reranker. The best results of text/vision/hybrid are in boldface, and the overall
best results across text&vision&hybrid are further colored.
multi-modal, multi-document, and multi-turn scenarios; (2) MM-
DocIR [5] containing 1,658 single-document VQA questions for
focused evaluation of page and chunk-level retrieval performance.3
5.2
