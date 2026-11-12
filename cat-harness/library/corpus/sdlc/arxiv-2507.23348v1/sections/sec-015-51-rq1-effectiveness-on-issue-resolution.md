---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-015-51-rq1-effectiveness-on-issue-resolution
section_title: "RQ1: Effectiveness on Issue Resolution"
section_number: 5.1
pages: 6-7
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Table 1 presents the main experimental results comparing SWE-
Debate with state-of-the-art baselines on the SWE-Bench-Verified
dataset. We observe that SWE-Debate is able to solve 207 out of 500
problems, achieving 41.4% success rate. While individual baseline
approaches show varying performance across different language
models, SWE-Debate demonstrates consistent superiority over ex-
isting methods. Specifically, when comparing with methods using
the same DeepSeek-V3-0324 model, SWE-Debate achieves signifi-
cant improvements: 6.0% over SWE-Search, improving from 35.4%
to 41.4%, and 2.6% over SWE-Agent, improving from 38.8% to 41.4%.
Table 1: Main effectiveness results on SWE-Bench-Verified.
Method
Model
Pass@1
SWE-Agent
GPT-4o (2024-05-13)
23.0%
Claude-3.5 Sonnet
33.6%
DeepSeek-V3-0324
38.8%
SWE-Search
DeepSeek-V3-0324
35.4%
Moatless Tools
DeepSeek-V3-0324
34.6%
Agentless
GPT-4o (2024-05-13)
36.2%
DeepSeek-V3-0324
36.6%
AutoCodeRover
GPT-4o (2024-05-13)
38.4%
CodeAct
GPT-4o (2024-05-13)
30.0%
SWESynInfer
Claude-3.5 Sonnet
35.4%
GPT-4o (2024-05-13)
31.8%
Lingma SWE-GPT 72B
30.2%
OpenHands
DeepSeek-V3-0324
38.8%
SWE-Debate
DeepSeek-V3-0324
41.4%
It is important to note that SWE-Debate outperforms even the
strongest baseline configurations, including OpenHands with DeepSeek-
V3-0324 and SWE-Agent with DeepSeek-V3-0324, both achieving
38.8%. This demonstrates that our competitive multi-agent de-
bate framework provides substantial benefits beyond what can
be achieved through model selection alone.
SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution
Conference’17, July 2017, Washington, DC, USA
Finding 1: SWE-Debate achieves 41.4% Pass@1 on issue reso-
lution, representing a 2.6 percentage point improvement over
the strongest baseline using the same model, demonstrating the
effectiveness of competitive multi-agent debate for repository-
level issue resolution.
5.2
