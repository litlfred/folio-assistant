---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-010-ablation-studies
section_title: "Ablation Studies"
section_number: null
pages: 7-9
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
To systematically analyze the contribution of each component in TCAR, we conduct ablation studies
along three dimensions: reasoning capability, training strategy, and the source of RL initialization.
Effect of Reasoning This experiment evaluates the impact of explicit reasoning chains[10] on routing
performance.
• Without reasoning: The model performs direct classification prediction and outputs only Aq.
• With reasoning: The model first generates Cq as an explicit and interpretable reasoning chain
and then outputs the set of agents Aq.
We evaluated both settings on the public datasets and the QCloud dataset. The results 2 show that
even without reasoning, the model achieves strong performance after fine-tuning; however, incorporating
reasoning consistently leads to further improvements. This observation suggests that reasoning enhances
the model’s generalization ability.
7
TCAndon-Router
0
20
40
60
80
100
Refining Agent Win Rate (%)
Consultation
Troubleshooting
27.0%
63.0%
Win
Tie
Lose
Figure 3: In scenarios where consultation-type and troubleshooting-type queries create conflicts among
candidate agents, we compare two strategies: randomly selecting a single agent to respond versus allowing
multiple agents to answer followed by aggregation by the Refining Agent. The results show that the Refin-
ing Agent achieves a significantly higher human preference win rate, particularly for troubleshooting-type
queries.
Reasoning Setting
CLINC150
HWU64
MINDS14
SGD
QCloud
TCAR (without Reasoning)
89.65
87.83
96.45
84.96
91.33
TCAR (with Reasoning)
91.25
91.63
96.70
91.58
93.98
Table 2: Comparison of the performance with and without reasoning output
SFT-Only vs. SFT+RL This experiment evaluates the improvements brought by applying DAPO
during the RL stage.
• SFT-only: The model is trained using supervised fine-tuning only.
• SFT+RL: After SFT, we further filter the training set and retain only high-entropy tokens for
RL.
We compare the performance of the SFT-only model with the model further optimized through RL.
Experimental results show that RL leads to consistent and significant improvements.
In particular,
on the QCloud dataset, RL enhances recall while maintaining high precision, effectively mitigating the
common issue of SFT-only models being overly conservative and outputting only a single agent.
Training Method
CLINC150
HWU64
MINDS14
SGD
QCloud
SFT-Only
91.32
90.30
96.69
86.30
93.77
SFT+RL
91.25
91.63
96.70
91.58
93.98
Table 3: Comparison between SFT-only training and SFT followed by RL.
RL Initialization: SFT-Only vs. SFT+Slerp Since the initialization point of RL has a substantial
impact on the final performance, we compare two different SFT models used for RL initialization:
• SFT-Only: RL initialized from the SFT model.
• SFT+Slerp): RL initialized from the model obtained via SFT-Slerp merging.
Slerp is a model-merging technique [39, 40] that effectively enhances model generalization. We trained
five different SFT models on five distinct datasets and then merged them using Slerp. The resulting
merged model exhibits higher exploration capability in the early stages of RL, reflected by a higher
pass@k score.
We aim for the model in the RL phase to transition from achieving high pass@k to
achieving high pass@1[41]. We conducted RL training using both the SFT model and the Slerp-merged
model. As shown in Table 4, the Slerp-based model does not exhibit a significant improvement in the final
metrics. However, from Figure 4b, we observe that although the reward curves of the two initialization
strategies are similar, the Slerp model maintains a higher entropy, indicating stronger exploration. This
8
TCAndon-Router
RL Initialization
CLINC150
HWU64
MINDS14
SGD
QCloud
SFT-Only
91.25
91.63
96.70
91.58
93.97
SFT+Slerp
90.43
91.45
96.82
91.53
93.20
Table 4: Comparison between initializing the RL stage with the SFT model and initializing it with the
Slerp-merged model.
0
250
500
750
1000
1250
1500
1750
Step
0.4
0.5
0.6
0.7
0.8
0.9
Entropy
SFT+Slerp
SFT-Only
(a) RL Reward
0
250
500
750
1000
1250
1500
1750
Step
0.4
0.5
0.6
0.7
0.8
0.9
Entropy
SFT+Slerp
SFT-Only
(b) RL Entropy
Figure 4: Comparing RL initialized from the SFT model and from the Slerp-merged model, we observe
that both approaches achieve almost the same reward throughout training.
In contrast, the Slerp-
initialized model maintains higher entropy, suggesting that it explores a broader solution space.
enhanced exploration leads to better generalization and provides greater potential for further fine-tuning
based on the merged model.
Summary of Ablation Findings
