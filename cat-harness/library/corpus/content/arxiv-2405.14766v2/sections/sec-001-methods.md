---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-001-methods
section_title: "Methods"
section_number: null
pages: 2-3
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
Evaluation of LLMs is a broad and rapidly growing field of research [15] ranging from
very general assessments of capabilities or intelligence [3] to very task specific performance
results [17] (Fig. 5). We focus on domain and task specific evaluations of LLMs within
public health and provide a review of the relevant literature in Sec. 6.
The appropriate evaluation methodology largely depends on three factors: level of generality
(see Sec. 6.1.1), types of task (see Sec. 6.1.2), and outcome of interest (see Sec. 6.1.3).
For our initial evaluations of LLMs within public health, we aim to provide a high level
1For background, Zhao et al. [1] and Kaddour et al. [2] are recent surveys on LLMs and their applications.
2
assessment of LLM performance over a broad range of tasks, models, and sub-domains. To
enable this we focus on classification and extraction NLU tasks that can be assessed using
automated evaluation approaches. By collecting representative internal data and annotations
in collaboration with public health experts, we aim to also provide early evidence of potential
task specific performance in individual areas. Specifically we use:
1. 7 New Annotated Datasets - We collect and manually annotate seven datasets with public
health specific annotations using a combination of internal, synthetic, and external free
text sources.
2. Existing Datasets and Literature - We identify and include six evaluation datasets from
existing work that are applicable to public health. To inform and develop our public
health evaluations we also review the literature on relevant evaluations in related domains,
such as Medicine. We provide a detailed overview of these external results and datasets
in Sec. 6.2 and Sec. 2.1.
3. 16 Public Health Specific Evaluation Tasks - In total we bring together 16 classification
and extraction evaluation tasks across three sub-domains of public health, see Fig. 1.
4. 11 Open-weight LLMs Evaluated and GPT-4 Series Comparisons - We deploy and assess
eleven open-weight models ranging from 7-123 billion parameters across all tasks. For a
subset of 11 tasks, we also evaluate three GPT-4 series models (turbo, 4o, and 4o-mini)
in order to understand how open-weight model performance compares to some of the
highest performing private models on our public health tasks.
2.1
