---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-036-judge-model-comparisons
section_title: "Judge model comparisons"
section_number: null
pages: 22-22
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
To compare judge models and assess the sensitivity of LLM performance to the judge model used we
also re-run the free form evaluation using three additional judge models with range of model sizes.
In addition to GPT-4o-Mini, we use Llama-3.3-70bn, MedGemma-27bn, and Phi-4-14bn. Overall
we find a high degree of agreement across the four judge models, with a Fleiss’s kappa of 0.64, see
Figure 10 for full results.
Figure 10: Comparison of PubHealthBench-FreeForm performance using different LLM judges.
*LLM used to generate benchmark.
A.7.2
