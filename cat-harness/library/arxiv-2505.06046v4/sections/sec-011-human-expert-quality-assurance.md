---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-011-human-expert-quality-assurance
section_title: "Human expert quality assurance"
section_number: null
pages: 5-5
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
To quality assure the benchmark and estimate the underlying rate of invalid questions, we manually
review a random sample of 800 questions (c.10% of the benchmark). Based on this manual review
we estimate the rate of ambiguous or invalid questions in the full benchmark to be approximately
5.5% (4.1%-7.3%, 95% Wilson score CI) in the final dataset. See Appendix A.4 for annotation
details.
However, the majority of questions identified as invalid related to situations where one of the distrac-
tor options could be considered an equally good answer to the specified correct answer. Therefore,
whilst these questions were deemed ambiguous, the correct answer should remain one of the most
likely guesses for LLMs. Accounting for this random guessing over usually two correct answers,
we expect the upper bound score on this benchmark to be approximately 97%. This is supported by
the observed model performance on questions classified as invalid, as discussed in Section 5.
4
