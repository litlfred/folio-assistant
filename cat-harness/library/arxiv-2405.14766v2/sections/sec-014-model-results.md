---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-014-model-results
section_title: "Model Results"
section_number: null
pages: 11-12
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
Table 3 shows the performance of models on different tasks. Llama-3.3-70B-Instruct is the
highest scoring open-weight model (or equal highest) across 8 of the 16 tasks according to
micro-F1.
Flan-T5-xxl, Llama-3-8B-Instruct, Llama-3.1-8B-Instruct, and Mistral-7B-Instruct-v0.2
were each the worst performing model on at least one task. The authors note that smaller
models appear to have outputs that are more fragile with respect to the exact wording of the
prompt. This means that particularly low performance on a given task may be more related
to a failure of the model to understand the prompter’s intentions, rather than the model not
being capable of performing the task with optimised prompts.
On some tasks the difference in performance between models is very considerable. For
instance, scaling parameter size from the Llama-3-8B-Instruct to the Llama-3-70B-Instruct
leads to greater than 10 percentage point increases in micro-F1 on tasks such as MMLU
Genetics, MMLU Nutrition, Health Advice, and Causal Relation classification (smaller gains
are observed for the 3.1 series models). Similarly, moving from a Llama-2-70B base model
to a Llama-3-70B base model also considerably improves performance on the same tasks.
11
We observe incremental gains across the Llama 3 70bn model family with each version
having a higher mean task rank than the previous. We also note that Mistral-Large’s relatively
poor performance for its size may be due to our implementation using INT-4 quantization vs
FP16 for the other models, due to compute constraints.
3.2
