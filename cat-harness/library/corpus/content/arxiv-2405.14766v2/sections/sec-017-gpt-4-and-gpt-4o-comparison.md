---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-017-gpt-4-and-gpt-4o-comparison
section_title: "GPT-4 and GPT-4o Comparison"
section_number: null
pages: 13-14
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
Finally, to understand how current open-weight models compare on extraction and classifica-
tion tasks to some of the highest performing private models, we evaluate three GPT-4 and
GPT-4o models on 11 of the 16 tasks, see Table 4.
We find GPT-4-Turbo, GPT-4o, and GPT-4o-Mini perform well across all tasks and are
the highest scoring models overall on 5 of the 11. The GPT-4 series models particularly
13
Llama-3.3
70B
GPT-4o
Mini
GPT-4
Turbo
GPT-4o
Task Name
NCBI Disease Extraction
0.88
0.79
0.83
0.85
GI Classification
0.94
0.92
0.84
0.87
GI Symptom Extraction
0.90
0.90
0.89
0.86
BioDex Drugs Extraction
0.34
0.33
0.33
0.34
Health Advice
0.82
0.81
0.83
0.85
Guidance Recommendations
0.86
0.86
0.85
0.87
Causal Relations
0.62
0.60
0.64
0.57
PubMedQA
0.77
0.67
0.75
0.54
Food Extraction
0.89
0.91
0.89
0.91
MMLU Genetics
0.86
0.91
0.96
0.98
MMLU Nutrition
0.86
0.80
0.88
0.91
Table 4: Zero-shot GPT-4 Results. Bold indicates the highest open-weight model micro-F1 score on
a given task. Underlined indicates the highest micro-F1 score across all models.
outperforms open-weight models on MMLU Genetics. However, looking across all tasks,
the best GPT-4 models perform comparably to the most recent Llama-3.3-70B-Instruct
open-weight model.
3.5
