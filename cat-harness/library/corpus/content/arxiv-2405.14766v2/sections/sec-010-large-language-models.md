---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-010-large-language-models
section_title: "Large Language Models"
section_number: null
pages: 9-10
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
We focus on evaluating open-
source/weight LLMs that we host internally to ensure comparability of results, as well as for data
protection. We run all models in FP16 precision where feasible. We include the latest GPT-4 models
for comparison on a subset of tasks.
2.2.1
Large Language Models
In our initial evaluations we assess eleven open-weight LLMs ranging from 7 billion to 123
billion parameters (including the Llama-2 and 3, Mistral, Command-R, Gemma, and Flan-T5
base models), see Table 2. We also investigate the performance impact of INT-4 quantization
across the Llama-3 family of models.
To run the evaluations, we have developed an internal LLM API on UKHSA High Perfor-
mance Computing (HPC) resources [7] using models from the HuggingFace repository [63]
and open-source packages such as transformers [64] and vLLM [65]. This enables us to
securely use datasets where data governance and security mean they are not authorised
to leave UKHSA systems. It also allows us to control implementation details, such as
model quantisation, prompt templates, model versions, and generation configurations, that
have been shown to have potentially significant impacts on performance [66], allowing for
comparable and reproducible results.
In addition to evaluating internally hosted models, we also access some of the highest
performing private models (GPT-4 Turbo and GPT-4o), via the OpenAI API [41]. While
2The number of "shots" refers to how many example question-answer pairs are provided in the prompt, in
addition to the question being asked.
9
we do not run GPT-4 series models for all evaluations primarily due to data restrictions, we
