---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-006-training-tcar
section_title: "Training TCAR"
section_number: null
pages: 4-6
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
To endow the router R with both multi-agent selection capabilities and interpretable reasoning, we adopt
a two-stage[28] training strategy. We first apply supervised fine-tuning (SFT)[29] to teach the model
the basic “reason–then–select” pattern. We then further enhance the quality of agent selection and the
stability of reasoning through reward-based reinforcement learning using DAPO [30].
Supervised Fine-Tuning. In the first stage, we train the model using labeled data with standard
causal language modeling. SFT equips the model with the following capabilities: (i) performing semantic
alignment between the query and agent descriptions, thereby improving its generalization ability when
dynamically onboarding new agents; and (ii) generating structured outputs, including the reasoning chain
Cq and the candidate agent set Aq. Instead of adopting the conventional <think> tag used in “think”-
style models, we introduce a dedicated <reason> tag to ensure compatibility with both instruction-
following models and think models.
The SFT stage is optimized using the standard autoregressive
4
TCAndon-Router
Figure 2: (a) Solo Agent: the router outputs a single agent, and that agent directly responds to the
user’s query.(b) Refining Agent: the router outputs a set of candidate agents, and the refining agent
integrates their outputs into a final answer.
language modeling loss:
LSFT(θ) = −
T
∑
t=1
log pθ(yt | y<t, q, A),
{y1, . . . , yT } = (Cq, Aq).
However, SFT also has its limitations: the model may overfit to annotation templates or generate
reasoning in a mechanical manner, making it necessary to further improve both the quality of reasoning
and the accuracy of agent selection.
Reinforcement Learning. To improve the robustness of routing decisions and the soundness of the
generated reasoning, we introduce a reinforcement learning stage on top of SFT. Here, we adopt the
DAPO method to train the model, with the training objective formulated as:
JDAPO(θ) = E(q,a)∼D,{oi}G
i=1∼πθold (·|q)


1
∑G
i=1 |oi|
G
∑
i=1
|oi|
∑
t=1
min
(
ri,t(θ) ˆAi,t, clip (ri,t(θ), 1 −εlow , 1 + εhigh ) ˆAi,t
)


s.t. 0 < |{oi| is_equivalent (a, oi)}| < G.
For reward design[31], since the SFT stage already enables the model to produce well-formatted outputs
with a reasonable reasoning length Cq, we apply the reward only to the final agent set Aq. Because Aq is
a set that may contain one or multiple agents, we decompose the routing reward into two parts. Let A∗
denote the gold agent set and Aq the predicted candidate agent set. The first reward focuses on whether
each element in Aq belongs to A∗(analogous to precision), while the second reward evaluates whether
Aq covers all correct agents (analogous to recall or a coverage constraint). Formally, the rewards are
defined as follows:
First, we define a local reward based on the degree of set overlap, which measures the proportion of
agents in the predicted set Aq that are correct. This reward encourages the model to reduce irrelevant
or incorrect agent predictions.
R1(Aq, A∗) =
|Aq ∩A∗|
max(1, |Aq|),
Second, we introduce a coverage reward to penalize missing correct agents.
The model receives an
additional reward if and only if its predicted set Aq fully contains the ground-truth set A∗; otherwise,
this reward is zero.
R2(Aq, A∗) =
|Aq ∩A∗|
max(1, |A∗|),
To prevent the model from generating excessively long outputs or endlessly listing agents, we introduce
an additional length-penalty term[32]. Combining all three components, we define the final reward as:
R(Aq, A∗) = α R1(Aq, A∗) + (1 −α)R2(Aq, A∗) −βmax(|Aq| −|A∗|, 0)
5
TCAndon-Router
where α and β are weighting hyperparameters. The coeﬀicient α balances the trade-off between the
correctness of the predicted set (precision-like) and its coverage of the ground-truth set (recall-like),
while β controls the strength of the length-penalty term. In practice, we directly incorporate this reward
into the policy optimization objective during the reinforcement learning stage, encouraging the router
to avoid over-predicting irrelevant agents while still covering all truly relevant experts in multi-agent
scenarios.
4
