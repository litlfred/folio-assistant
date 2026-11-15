---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-019-a2-experiment-designs
section_title: "Experiment Designs"
section_number: A.2
pages: 8-8
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Mix-1 split constitution. Train merges SWE-Smith train trajectories with 4/5 of a 5-fold-CV partition of SWE-Bench
Verified. We construct a validation split using the tasks from SWE-Smith, while having two separate test split from each of
SWE-Smith and SWE-Bench Verified.
Value head and training. The LoRA adapter for ˆr1 uses r=32, α=64, dropout 0.05 on attention/MLP projections. For
training, we use 5 epochs, lr 5×10−5 cosine with 50-step warmup, effective batch 16, and context length limit of 8192 tokens.
We use a packed procedure: one row per trajectory and the head is applied at every user-turn boundary K ∈{0, . . . , Kmax}
via a single shared forward pass. Each q is replaced by a uniformly-sampled paraphrase from a 3-way LLM rephrasing
during training and validation, and we set Kmax = 4.
Baselines. Three prompt-only routers in the Equation (2) family — logistic regression, k-NN, and XGBoost on OpenAI
text-embedding-3-large embeddings of q — and our non-temporal router (K=0 instance of our framework,
conditioning only on q).
