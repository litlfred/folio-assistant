---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-017-53-rq3-localization-performance-comparison
section_title: "RQ3: Localization Performance Comparison"
section_number: 5.3
pages: 7-8
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Table 3: Localization Performance on SWE-Bench-lite.
Method
Model
Acc@1 (File)
Agentless
GPT-4o (2024-05-13)
67.15
Claude-3.5 Sonnet
72.63
SWE-Agent
GPT-4o (2024-05-13)
57.30
Claude-3.5 Sonnet
77.37
DeepSeek-V3-0324
67.00
SWE-Search
GPT-4o (2024-05-13)
73.36
Claude-3.5 Sonnet
72.63
CodeActAgent
GPT-4o (2024-05-13)
60.95
Claude-3.5 Sonnet
76.28
LocAgent
Qwen2.5-7B (FT)
70.80
Qwen2.5-32B (FT)
75.91
Claude-3.5 Sonnet
77.74
KGCompass
Claude-3.5 Sonnet
76.67
SWE-Debate
DeepSeek-V3-0324
81.67 (+3.93)
Table 3 shows the localization performance comparison across
different methods on the SWE-Bench-Lite dataset, which we adopt
to facilitate direct comparison with existing approaches [1, 6, 20, 43,
46], referecing the results from LocAgent [6]. SWE-Debate achieves
81.67% file-level localization accuracy, significantly outperform-
ing all baseline methods. When comparing with methods using the
same DeepSeek-V3-0324 model, SWE-Debate demonstrates substan-
tial improvements: 14.67% over SWE-Agent, improving from 67.00%
to 81.67%. This represents an 3.93 percentage point improvement
over the strongest baseline across all model configurations, surpass-
ing LocAgent with Claude-3.5 Sonnet which achieves 77.74%.
The improvement in localization accuracy is largely attributed
to our graph-guided approach for constructing multiple fault prop-
agation traces. By systematically exploring code dependency re-
lationships and generating diverse candidate chains, SWE-Debate
captures structural patterns that single-pass exploration methods
frequently miss. The dramatic improvement over SWE-Agent using
the same model—from 67.00% to 81.67%—particularly highlights the
effectiveness of our structured reasoning approach compared to tra-
ditional search-based methods. Compared to baseline approaches
that perform localization once, our method aggregates multiple
potential paths, significantly increasing the likelihood that at least
one trace contains the correct fix location.
The results demonstrate that our architectural innovations pro-
vide benefits that transcend model capabilities. While methods
using stronger language models like Claude-3.5 Sonnet generally
achieve better localization performance than those using GPT-
4o, SWE-Debate with DeepSeek-V3-0324 surpasses even the best
Claude-3.5 Sonnet results. More importantly, the consistent supe-
riority over other methods using the identical DeepSeek-V3-0324
model confirms that performance gains stem from enhanced rea-
soning frameworks rather than model sophistication alone.
Furthermore, the gap between our localization performance and
that of specialized localization methods like LocAgent demonstrates
Conference’17, July 2017, Washington, DC, USA
Li et al.
substantial improvement, with SWE-Debate achieving 81.67% com-
pared to LocAgent’s 77.74%. This shows that competitive multi-
agent debate can enhance even domain-specific approaches. The
reason is that our debate process forces agents to systematically
evaluate competing localization hypotheses, preventing premature
convergence on suboptimal solutions.
Finding 3: SWE-Debate achieves 81.67% file-level localization
accuracy, surpassing the strongest baseline by 3.93%, demon-
strating that graph-guided fault propagation traces combined
with competitive debate enable more accurate fault localization
than individual exploration approaches.
5.4
