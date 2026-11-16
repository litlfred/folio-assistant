---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Public health guidance represents an important source of information for UK residents and experts
to inform personal, professional, and clinical decision making. The release of highly capable Large
Language Models (LLMs) (Minaee et al., 2025), and particularly chatbots (OpenAI, 2022), could
†joshua.harris@ukhsa.gov.uk
1
arXiv:2505.06046v4  [cs.CL]  9 Mar 2026
Preprint.
represent a significant shift in how public health guidance is retrieved, analysed, and disseminated.
This in turn raises significant opportunities and risks for public health institutions both internally
and when engaging the public.
Whilst LLMs often undergo a broad range of evaluations during development (Grattafiori et al.,
2024; Google, 2025; OpenAI, 2025b; Anthropic, 2025), and there are a number of existing bench-
marks in the medical domain, there is currently an important gap in field of public health, with
no comprehensive LLM benchmarks covering this domain, including for existing UK Government
guidance. Furthermore, due to guidance undergoing regular revisions, and differing guidance be-
ing issued across institutions and geographies, accurate up to date knowledge of UK public health
guidance may be particularly challenging for LLM systems. Therefore, as recently observed for
BBC news stories (BBC, 2024), there is a risk that LLM based applications and chatbots generate
hallucinations (Huang et al., 2025) or incomplete information regarding UK public health advice.
This in turn could have a significant impact on the public. These risks, combined with the increasing
desire within the UK Government to incorporate LLMs into existing real world processes (Depart-
ment for Science & Technology, 2023; UKHSA, 2023), means comprehensive evaluations of LLMs’
understanding of UK public health guidance are needed.
In this paper we introduce a new dataset, Multiple-Choice Question Answering (MCQA) bench-
mark, and free form response benchmark for assessing LLMs’ knowledge across a broad range of
UK public health guidance.1 Specifically our contributions include:
PubHealthBench a fully grounded MCQA benchmark - We collect, extract, markdown format,
and chunk information from over 500 publicly available UK Health Security Agency (UKHSA)
PDF and HTML documents from the UK Government website (gov.uk).2 We implement an auto-
mated MCQA generation and validation pipeline grounded in the extracted guidance source text.
This enables us to generate a new benchmark with over 8000 MCQA questions to test LLM knowl-
edge across a broad range of current guidance. We provide results for both the full benchmark
(PubHealthBench-Full) and a manually reviewed subset (PubHealthBench-Reviewed).
PubHealthBench-FreeForm - To assess LLMs in a more realistic real-world setting we also imple-
ment a free form response benchmark using the questions from the manually reviewed subset. By
utilising the fact that every question can be linked back to the original source chunk and document,
we implement a grounded LLM judge to assess responses.
Initial LLM evaluations - We evaluate 24 private and open-weight LLMs on this new public health
benchmark. Given our focus on assessing knowledge, we primarily focus on SOTA non-reasoning
models, but also include some leading reasoning models for comparison.
Manual human expert review and human baseline - To quality assure the benchmark and estab-
lish an upper bound for performance, human experts manually reviewed a random sample of 800
MCQA examples (approx. 10% of the benchmark). Furthermore, in order to compare to human
performance, 5 humans also took sample tests (total 600 MCQA examples) to establish a human
baseline with the use of search engines. This provides an initial indication of the boundary at which
LLMs become similarly accurate to a cursory search by non-expert humans.
2
