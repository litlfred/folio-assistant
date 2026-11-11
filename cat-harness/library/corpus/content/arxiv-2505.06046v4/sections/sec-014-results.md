---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-014-results
section_title: "Results"
section_number: null
pages: 6-6
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
PubHealthBench-Full - the full MCQA benchmark, providing the broadest assessment of LLM
capabilities. This enables us to provide results across granular topic areas within public health.
PubHealthBench-Reviewed - the random test subset of 760 MCQA questions that have been man-
ually reviewed by human experts, we report results both including and excluding questions classified
as ambiguous or invalid so as to make the results comparable to the full benchmark. For the most
expensive models we run this subset instead of the full benchmark for cost reasons.
PubHealthBench-FreeForm - the same manually reviewed subset as in PubHealthBench-Reviewed
but only asking the question (without multiple choice options) and allowing for open-ended free
form responses, similar to how a chatbot may respond in real world uses cases. We use a grounded
LLM judge to assess whether the free text answer is consistent with the source material.
4.2
