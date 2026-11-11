---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-009-main-results
section_title: "Main Results"
section_number: null
pages: 7-7
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
Table 1 presents the performance of all models across the five datasets (CLINC150, HWU64, MINDS14,
SGD, QCloud). Overall, general-purpose LLMs such as GPT-5.1 and DeepSeek-v3.1 outperform most
small-scale open-source models by a considerable margin.
Despite having only 4B parameters, our
TCAR achieves state-of-the-art performance on all datasets except CLINC150. CLINC150 contains 150
intent categories, resulting in extremely long prompts (averaging 18k tokens), which pose challenges for
smaller models that struggle with ultra-long sequence processing. On multi-turn (SGD) and multilingual
(MINDS14) datasets, TCAR demonstrates clear and substantial advantages. On the QCloud dataset
which features high agent conflict frequency and real enterprise ambiguity—TCAR surpasses even current
leading general-purpose LLMs in F1, highlighting its robustness in multi-agent routing scenarios.
Models
CLINC150
HWU64
MINDS14
SGD
QCloud
GPT-5.1
93.84
85.59
95.59
73.90
92.93
Claude-Sonnet-4.5
94.21
87.40
96.20
76.02
91.45
DeepSeek-v3.1-terminus
88.29
88.10
95.72
79.70
92.98
ArcRouter
62.98
69.33
91.79
65.59
-
Qwen3-Embedding-4B
57.21
54.27
94.12
37.02
-
Qwen3-4B-Instruct-2507
70.12
80.29
90.08
58.74
80.81
TCAR(4B)
91.25
91.63
96.70
91.58
93.98
Table 1: Comparison of model performance across datasets.
For the QCloud dataset, the metric is
reported as F1, while for all other datasets the metric is Accuracy.
We further evaluate the effectiveness of the downstream Refining Agent when TCAR outputs multi-
ple candidate agents.
As shown in Figure 3, the Refining Agent implemented using DeepSeek-v3.1
as the underlying LLM—significantly enhances the quality of response in our QCloud data set. For
consultation-type queries, a single agent is often suﬀicient to produce high quality responses.
How-
ever, for troubleshooting-type queries, an individual agent typically fails to provide complete coverage,
whereas the Refining Agent integrates and consolidates responses from multiple agents, resulting in more
comprehensive and reliable answers.
4.3
