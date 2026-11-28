---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-002-mcqa-llm-evaluations
section_title: "MCQA LLM evaluations"
section_number: null
pages: 2-3
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Using Multiple-Choice Question Answering (MCQA) to assess the knowledge of LLMs is well
established in the literature. Earlier work evaluating LLM knowledge in specific domains often used
existing MCQA human assessments and exams (OpenAI, 2023; Bommarito et al., 2023; Jin et al.,
2020; Pal et al., 2022), for example in the medical domain using evaluations from the US Medical
Licensing Examination (USMLE) (Kung et al., 2023; Singhal et al., 2023).
Broader evaluations of LLM knowledge and capabilities have also been introduced.
One of
the most widely adopted being the Massive Multitask Language Understanding (MMLU) bench-
1The guidance included can cover the entire UK or individual constituent countries, most documents pri-
marily relate to English public health guidance. We also only included English language documents.
2GOV.UK reuse policy: https://www.gov.uk/help/reuse-govuk-content
2
Preprint.
Figure 2: Example PubHealthBench MCQA benchmark questions.
mark (Hendrycks et al., 2021). More recently the MMLU-Pro benchmark by Wang et al. (2024),
updated the original MMLU evaluations for errors (Gema et al., 2024) and increased the ques-
tion difficulty. New domain specific MCQA LLM evaluations have also been created, such as the
GPQA (Rein et al., 2023) and ARC (Clark et al., 2018) benchmarks within science.
2.2
