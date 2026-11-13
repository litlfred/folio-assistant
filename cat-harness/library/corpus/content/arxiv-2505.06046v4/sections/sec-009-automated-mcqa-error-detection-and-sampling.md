---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-009-automated-mcqa-error-detection-and-sampling
section_title: "Automated MCQA error detection and sampling"
section_number: null
pages: 4-5
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
To check consistency with the source text and improve the quality of our question set, we use
LLMs to filter potentially invalid questions. For full details of the approach and evaluation see
Appendix A.1. We select the Llama-3-70bn-Instruct model for this error detection step and filter
the 15,666 candidate MCQA questions down to 14,440 that were not flagged as containing poten-
tial errors. Finally, we remove questions relating to documents that contain guidance that has been
withdrawn, and balance our dataset between HTML and PDF documents to ensure a more even rep-
resentation of topics (as PDF documents were often longer). We retain the remaining approximately
4,000 unused questions from PDF source documents as a potential internal hold-out set.
4
Preprint.
3.5
