---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-018-54-rq4-impact-of-the-chain-depth
section_title: "RQ4: Impact of the Chain Depth."
section_number: 5.4
pages: 8-8
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
To investigate the optimal configuration for multi-agent reason-
ing in software fault localization, we study the impact of chain
depth on localization performance. To balance computational effi-
ciency with representative evaluation, we constructed a dataset of
75 instances, termed SWE-Bench-Verified-S, consisting of 50 sam-
ples from SWE-Bench-verified-mini 3 and 25 additional instances
randomly selected in SWE-Bench-Verified.
Figure 3 shows the impact of varying chain depth in the com-
petitive debate process on this dataset. We observe that increasing
the chain depth from 1 to 5 consistently boosts file-level localiza-
tion accuracy, reaching a peak Acc@1(File) of 86.7%. This suggests
that deeper reasoning chains enable more effective exploration of
the code graph, capturing complex dependencies and contextual
signals that shallow chains often miss. These results highlight the
benefits of multi-step reasoning in guiding the model toward more
informed and accurate localization decisions.
1
3
5
7
Chain Depth
0.65
0.70
0.75
0.80
0.85
0.90
Acc@1(File)
70.7%
72.0%
86.7%
82.7%
Figure 3: Impact of the Chain Depth.
However, we also find that increasing the chain depth beyond
5 leads to diminishing returns and even slight performance degra-
dation. This suggests a trade-off between reasoning depth and
relevance. Longer chains are more likely to include information
unrelated to resolving the issue, which can distract the model and
reduce its ability to judge which chain is most likely to lead to a
correct fix. As a result, the debate process becomes less focused,
making it harder to converge on accurate localization decisions.
3https://huggingface.co/datasets/MariusHobbhahn/swe-bench-verified-mini
Finding 4: A chain depth of 5 achieves the best trade-off be-
tween reasoning depth and relevance, yielding the highest lo-
calization accuracy. Further increases introduce distracting in-
formation that hinders effective decision-making during the
debate.
5.5
