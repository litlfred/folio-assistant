---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-008-experimental-setup
section_title: "Experimental Setup"
section_number: null
pages: 6-7
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
This section introduces the datasets, baselines, evaluation metrics, and implementation details used to
evaluate TCAR. All experiments focus on the core task of multi-agent domain routing, aiming to thor-
oughly assess TCAR’s effectiveness under domain conflicts, ambiguous intents, and real-world enterprise
scenarios.
Datasets. We conduct evaluations on four public intent-classification datasets and one internal enter-
prise dataset:
• CLINC150 [14]: Contains 150 intent categories covering everyday conversational scenarios. The
task boundaries are clear, but the large number of classes leads to long agent descriptions, posing
challenges for LLMs.
• HWU64 [15]: Includes 64 intents with relatively high cross-domain ambiguity.
• MINDS14 [16]: A multilingual dataset spanning 14 domains, used to test router stability under
cross-lingual semantic transfer.
• SGD [17]: A multi-turn dialogue dataset designed to evaluate routing performance in multi-turn
conversational settings.
• QCloud: Additionally, we construct a real-world enterprise dataset from Tencent Cloud, covering
domains such as networking, cloud storage, CDN, security, databases, and application operations.
Compared with public datasets, it exhibits stronger domain coupling, higher intent ambiguity,
and more frequent agent conflicts, making it a crucial benchmark for assessing the practicality of
multi-agent routing systems.
Evaluation Metrics. To comprehensively evaluate routing performance, we adopt the following metrics:
• For single-agent datasets, we primarily report accuracy. For multi-agent datasets, we compute F1
to measure whether the model successfully and accurately identifies all agents capable of handling
a given query.
• End-to-End Task Success Rate, which evaluates the overall response quality after multi-agent
collaboration and Refining Agent processing, offering a system-level assessment of routing capabil-
ity.
Baselines. Since static label routing is diﬀicult to deploy in most real-world enterprise scenarios, we focus
on comparing against dynamic routing approaches. We evaluate a variety of both proprietary and open-
source large language models, including GPT-5.1[33], Claude-4.5[34], DeepSeek-v3.1[35], ArcRouter[5],
as well as the Qwen3[36] family, which also serves as our base model for training.
Implementation Details. We experimented with several model sizes from the Qwen3 family and ulti-
mately selected Qwen3-4B-Instruct-2507 for open-sourcing, achieving a strong balance between effective-
ness and eﬀiciency. To ensure training data compatibility and avoid reliance on model-specific reasoning
formats, we did not use Qwen3’s native <think> tag. Instead, we introduced a unified <reason> tag
for generating reasoning chains. Full-parameter SFT was conducted using the ms-swift framework[37]
with data parallelism across 8 GPUs, Adam optimizer, batch size of 256, training for 1 epoch, an initial
learning rate of 2e-5, and a warmup ratio of 0.1. During the RL stage, we use the SFT model with a
6
TCAndon-Router
temperature of 1 and perform 8 rollouts per training sample. If the rollout consistency exceeds τ > 0.6,
we consider the sample to be already well-learned during SFT—essentially a low-entropy token [38]. Such
samples tend to cause near-zero variance when computing advantages during RL, leading to ineffective
optimization. Therefore, following the principles of [30], we remove these samples from the RL training
set to reduce unnecessary dynamic sampling and improve training eﬀiciency. We also experimented with
initializing the model using Slerp[39, 40], which allows the model to achieve higher pass@k performance
at the early stage of RL training. We aim for the model in the RL phase to transition from achieving high
pass@k to achieving high pass@1[41]. Thereby preventing the model from suffering entropy collapse[42].
Both stages of training (SFT and RL) are implemented using the ms-swift framework.
4.2
