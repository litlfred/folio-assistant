---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-017-free-form-response-evaluation
section_title: "Free form response evaluation"
section_number: null
pages: 6-6
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Utilising the fact all questions are directly grounded in specific parts of the original source text we
use an LLM as a Judge setup (Zheng et al., 2023; Gu et al., 2025) for the free form answer evaluation.
We prompt a judge LLM (GPT-4o-Mini) with the question, ground truth answer, the LLM response,
and six retrieved related chunks. The judge is asked to assess the response and provide a binary
classification for whether it is consistent with the source text and ground truth MCQA answer. For
full details see Appendix A.7.
5
RESULTS
5.1
