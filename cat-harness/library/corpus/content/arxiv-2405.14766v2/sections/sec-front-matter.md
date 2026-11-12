---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-2
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
Evaluating Large Language Models for Public Health
Classification and Extraction Tasks
Joshua Harris1,†, Timothy Laurence1, Leo Loman1, Fan Grayson1, Toby Nonnenmacher1, Harry
Long1, Loes WalsGriffith1, Amy Douglas1, Holly Fountain1, Stelios Georgiou1, Jo Hardstaff1,
Kathryn Hopkins1, Y-Ling Chi1, Galena Kuyumdzhieva1, Lesley Larkin1, Samuel Collins1, Hamish
Mohammed1, Thomas Finnie1, Luke Hounsome1, Michael Borowitz1, and Steven Riley1
1. UK Health Security Agency
Abstract
Advances in Large Language Models (LLMs) have led to significant interest in
their potential to support human experts across a range of domains, including public
health. In this work we present automated evaluations of LLMs for public health tasks
involving the classification and extraction of free text. We combine six externally
annotated datasets with seven new internally annotated datasets to evaluate LLMs for
processing text related to: health burden, epidemiological risk factors, and public health
interventions. We evaluate eleven open-weight LLMs (7-123 billion parameters) across
all tasks using zero-shot in-context learning. We find that Llama-3.3-70B-Instruct is
the highest performing model, achieving the best results on 8/16 tasks (using micro-F1
scores). We see significant variation across tasks with all open-weight LLMs scoring
below 60% micro-F1 on some challenging tasks, such as Contact Classification, while
all LLMs achieve greater than 80% micro-F1 on others, such as GI Illness Classification.
For a subset of 11 tasks, we also evaluate three GPT-4 and GPT-4o series models and
find comparable results to Llama-3.3-70B-Instruct. Overall, based on these initial
results we find promising signs that LLMs may be useful tools for public health experts
to extract information from a wide variety of free text sources, and support public health
surveillance, research, and interventions.
Figure 1: Public Health Large Language Model (LLM) Evaluation Areas [Number of Evalua-
tions] and Task Evaluation Micro-F1 Scores by Model. (Left) We divide public health free text
processing into three sub-domains: (1) burden, such as reports of disease symptoms, cases, morbidity,
or mortality; (2) risk factors, such as environmental, behavioural, or biological contributors; (3)
interventions, pharmaceutical and non-pharmaceutical. (Right) Evaluation results (micro-F1 scores)
for seven open-weight LLM architectures (highest performing model evaluated from each) across the
16 tasks using zero-shot prompting.
†Corresponding author: joshua.harris@ukhsa.gov.uk
1
arXiv:2405.14766v2  [cs.CL]  19 Feb 2025
1
