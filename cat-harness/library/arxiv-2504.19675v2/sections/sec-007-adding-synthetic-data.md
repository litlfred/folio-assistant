---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-007-adding-synthetic-data
section_title: "Adding synthetic data"
section_number: null
pages: 3-3
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
We repeated the synthetic data generation process
three times per language and GND variant (total
3 × 2 × 2 times). The nDCG@10 scores of the
Bonsai projects increased by ~0.02 when adding
the first part of synthetic data, but the 2nd and 3rd
synthetic sets only increased the scores modestly
(see Figure 3 in Appendix A), so we stopped at
1 part original and 3 parts synthetic data.
We
didn’t use the synthetic data for training the MLLM
and XTransformer projects. MLLM does not need
