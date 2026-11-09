---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-016-experimental-setup
section_title: "Experimental setup"
section_number: null
pages: 6-6
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
We closely follow the prompts and answer extraction used in the MMLU-Pro benchmark (Wang
et al., 2024). However, as with the human baseline, in our LLM evaluations we seek to replicate a
similar query setup to that which might occur when interacting with a chatbot or within a simple
LLM based application. Therefore, we focus on zero-shot prompting (see Appendix A.6 for the
prompt templates), and only use CoT when it is the default behavior, as for reasoning models. For
comparability across models and to match the highest risk real world deployments, we do not allow
any LLMs access to external tools (e.g search) or information repositories.
4.3.1
