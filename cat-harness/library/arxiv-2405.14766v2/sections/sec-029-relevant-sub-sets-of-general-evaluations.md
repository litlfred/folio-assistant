---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-029-relevant-sub-sets-of-general-evaluations
section_title: "Relevant Sub-sets of General Evaluations"
section_number: null
pages: 31-33
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
In addition to these domain specific evaluations in the literature, it is also important to note
that there are subsets of general LLM evaluations that are relevant for public health (although
detailed breakdowns of subset results often are not reported).
The Massive Multitask Language Understanding (MMLU) benchmark [34] has subsets
31
covering general medical and scientific knowledge. More importantly, it also contains
subsets relating to virology, genetics, and nutrition, that are particularly relevant for some
public health sub-fields.
Also relevant for public health is the PubMedQA [54] Biomedical question answering
benchmark now included in the broader MultiMedQA [74] medical benchmark. The labelled
subset of PubMedQA consists of 1000 PubMed articles that have questions in the title,
combined with the manually annotated answer (yes, no, maybe) to the question based on a
review of the abstract (with and without concluding sections). This is particularly relevant for
assessing the ability of LLMs to infer conclusions to scientific questions based on a summary
of the evidence.
More recently, the Massive Multi-discipline Multimodal Understanding and Reasoning
(MMMU) [106] benchmark has a specific subset for public health. However, due to the
multi-modal nature of the benchmark it currently sits outside the scope of this paper.
32
7
