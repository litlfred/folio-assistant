---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-005-methods
section_title: "Methods"
section_number: null
pages: 4-4
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
To generate our MCQA benchmark we develop an automated pipeline (Figure 3) to extract free
text from documents, chunk it into sections, generate MCQA samples, and filter to a high quality
subset. We focus on an automated approach for three reasons: (1) generating thousands of MCQA
samples manually is highly time consuming, (2) public health guidance is frequently revised and
so any approach needs to be amenable to regular updates, and (3) it allows us to easily extend our
benchmarking to additional knowledge bases in the future.
3.1
