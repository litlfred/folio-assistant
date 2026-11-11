---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-011-52-experiment-setting
section_title: "Experiment Setting"
section_number: 5.2
pages: 3-4
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Datasets. We use both SWE-Smith and SWE-Bench for
training and test split. We only use SWE-Smith for the
validation split. See Section A for further details.
LLM agents and pairs. We generate trajectories from
four LLMs in mini-SWE-agent (Yang et al., 2024b) and
form two (weak, strong) pairs: weak ∈{gpt-5-mini,
deepseek-v3.2}, and gemini-3-pro-preview
for the strong model. The weak model has both lower per-
instance cost and lower resolved rate in every pair (Table 1).
Value head and training. For the value function ˆr1, we
use Qwen2.5-Coder-7B-Instruct with a 2-class
classification head fine-tuned via LoRA (Hu et al., 2021).
Baselines. Three prompt-only routers in the Equation (2)
family — logistic regression, k-NN, and XGBoost on Ope-
nAI text-embedding-3-large embeddings of q —
and our non-temporal router (K=0 instance of our frame-
work, conditioning only on q) are used as baselines.
5.3. Results
We evaluate routing on two (weak, strong) LLM pairs on
the test splits of SWE-Smith and SWE-Bench datasets.
We visualize the curve of routing results in Figure 2 and
compare the efficiency of SWE-Router against the baselines.
The gray bands in the plots indicate the random-assignment
reference, computed over 400 Monte-Carlo permutations
of the per-instance routing decision. We also use × and ⋆
to mark the all-weak and all-strong endpoints.
3
SWE-Router
$0.00
$0.20
$0.40
$0.60
$0.80
Avg. cost per instance (USD)
0.60
0.65
0.70
Resolved rate
gpt-5-mini 
 gemini-3-pro
$0.00
$0.20
$0.40
$0.60
$0.80
Avg. cost per instance (USD)
0.60
0.65
0.70
Resolved rate
deepseek-v3.2 
 gemini-3-pro
SWE-Router (K = 3)
Non-temporal (K = 0)
Embed+Logistic
Embed+kNN
Embed+XGB
random assignment (mean)
random assignment (±1 )
all-weak
all-strong
Figure 2. Cost-vs.-resolved routing curves on the held-out SWE-Bench Verified for the two (weak, strong) pairs. Each colored curve is the
threshold sweep of the corresponding router; the gray band is the random-assignment reference, computed as the per-cost-level mean
(±1σ) over 400 Monte-Carlo permutations of the per-instance routing decision; × and ⋆mark the all-weak and all-strong endpoints. The
curves of SWE-Router (K=3, green) are above the gray bands, and even exceed the strong-model marker for some thresholds, indicating
the synergistic effect of using the weak model for resolving tasks that the strong model could not.
