---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-1
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Preprint.
HEALTHY LLMS?
BENCHMARKING LLM KNOWL-
EDGE OF UK GOVERNMENT PUBLIC HEALTH INFOR-
MATION
Joshua Harris†, Fan Grayson, Felix Feldman, Timothy Laurence,
Toby Nonnenmacher, Oliver Higgins, Leo Loman, Selina Patel, Thomas Finnie,
Samuel Collins, Michael Borowitz
UK Health Security Agency (UKHSA)
ABSTRACT
As Large Language Models (LLMs) become widely accessible, a detailed un-
derstanding of their knowledge within specific domains becomes necessary for
successful real world use. This is particularly critical in the domains of medicine
and public health, where failure to retrieve relevant, accurate, and current infor-
mation could significantly impact UK residents. However, while there are a num-
ber of LLM benchmarks in the medical domain, currently little is known about
LLM knowledge within the field of public health. To address this issue, this pa-
per introduces a new benchmark, PubHealthBench, with over 8000 questions for
evaluating LLMs’ Multiple Choice Question Answering (MCQA) and free form
responses to public health queries. To create PubHealthBench we extract free
text from 687 current UK government guidance documents and implement an
automated pipeline for generating MCQA samples. Assessing 24 LLMs on Pub-
HealthBench we find the latest proprietary LLMs (GPT-4.5, GPT-4.1 and o1) have
a high degree of knowledge, achieving over 90% accuracy in the MCQA setup,
and outperform humans with cursory search engine use. However, in the free
form setup we see lower performance with no model scoring over 75%. There-
fore, while there are promising signs that state of the art (SOTA) LLMs are an
increasingly accurate source of public health information, additional safeguards
or tools may still be needed when providing free form responses.
Figure 1: (left) PubHealthBench Full and Reviewed model accuracy, (right) PubHealthBench-
FreeForm model accuracy. 95% Wilson CI. *LLM used to generate benchmark, **Judge LLM.
1
