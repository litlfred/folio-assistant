---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-033-experimental-setup-and-compute-resources
section_title: "Experimental setup and compute resources"
section_number: null
pages: 20-21
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
For all experiments and models where it can be specified we use greedy decoding (temperature 0).
For all OpenAI reasoning models we use ”reasoning effort=low” for cost reasons and due to the
knowledge based nature of the task.
Proprietary models are accessed via provider APIs, open-weight models are hosted internally on
HPC resources using vLLM (Kwon et al., 2023), with up to 2 x A100 80GB used per model. Addi-
tional compute (also using 2x A100 80GB) was used for benchmark generation pipeline.
We used a budget of $400 for the proprietary model evaluations, including the LLM judge.
20
Preprint.
A.6
