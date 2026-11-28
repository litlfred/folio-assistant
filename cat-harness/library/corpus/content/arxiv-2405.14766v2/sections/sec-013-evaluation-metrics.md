---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-013-evaluation-metrics
section_title: "Evaluation Metrics"
section_number: null
pages: 10-11
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
In this paper we primarily report the micro and macro F1 scores for each task. The F1
score is calculated as the harmonic mean of precision3 (positive predictive value) and recall4
(sensitivity). The micro-F1 score is calculated by weighting each label according to its
frequency in the dataset, while the macro-F1 score is calculated weighting each label equally.
It is also important to note that for single label classification tasks the micro-F1 score is
equivalent to accuracy.
Our headline measure of performance is micro-F1, as we are assessing raw performance
rather than accounting for potentially heterogeneous public health significance of different
labels.
For extraction tasks, we use exact matching of output strings. We treat extracted outputs not
found in the ground-truth label set as valid (i.e included in result calculations) but incorrect
classifications (because they are not one of the ground-truth label options).
For classification tasks, we also use exact matching but with simple post-processing to clean
outputs (e.g we would convert "Rule 1" -> "rule 1", and "1." -> 1).
3True Positives divided by the total number of True Positives and False Positives
4True Positives divided by the total number of True Positives and False Negatives
10
However, for some tasks with large numbers of possible labels and where it is feasible,
we implement more advanced post-processing to standardise outputs, such as for Country
Disambiguation, NCBI Disease Extraction, and Food Extraction.
3
Results
We primarily discuss results for internally hosted open-weight models as they can be eval-
uated for all tasks. We compare these results with GPT-4 series model performance on a
subset of tasks in Sec. 3.4.
Mistral
7B
Llama-3
8B
Llama-3.1
8B
Flan-T5
XXL
Gemma-2
27B-It
Command
R
Stable
Beluga-2
Llama-3
70B
Llama-3.1
70B
Llama-3.3
70B
Mistral
Large*
Task Name
NCBI Disease Extraction
0.63
0.80
0.87
0.72
0.83
0.83
0.82
0.84
0.83
0.88
0.83
GI Classification
0.86
0.82
0.84
0.89
0.82
0.91
0.90
0.92
0.94
0.94
0.94
GI Symptom Extraction
0.58
0.87
0.71
0.76
0.90
0.87
0.90
0.91
0.90
0.90
0.90
ICD-10 Description Classification
0.94
0.93
0.85
0.92
0.94
0.87
0.94
0.95
0.94
0.94
0.94
News Headline Classification
0.90
0.95
0.95
0.44
0.95
0.97
0.95
0.93
0.93
0.94
0.90
Guidance Topic Classification
0.73
0.87
0.82
0.94
0.91
0.87
0.91
0.94
0.93
0.96
0.89
BioDex Drugs Extraction
0.25
0.32
0.32
0.33
0.36
0.30
0.30
0.33
0.35
0.34
0.33
Health Advice
0.75
0.68
0.78
0.77
0.74
0.78
0.66
0.78
0.81
0.82
0.82
Guidance Recommendations
0.75
0.83
0.86
0.83
0.82
0.88
0.82
0.87
0.86
0.86
0.87
Causal Relations
0.38
0.26
0.39
0.50
0.45
0.42
0.35
0.51
0.53
0.62
0.58
PubMedQA
0.33
0.74
0.76
0.76
0.49
0.73
0.73
0.75
0.77
0.77
0.59
Contact Classification
0.24
0.23
0.26
0.28
0.42
0.36
0.46
0.48
0.49
0.53
0.22
Country Disambiguation
0.82
0.86
0.89
0.83
0.91
0.92
0.86
0.92
0.93
0.92
0.90
Food Extraction
0.87
0.87
0.88
0.83
0.88
0.88
0.88
0.88
0.88
0.89
0.87
MMLU Genetics
0.59
0.70
0.72
0.59
0.90
0.78
0.68
0.91
0.91
0.86
0.90
MMLU Nutrition
0.60
0.68
0.72
0.60
0.81
0.74
0.71
0.85
0.88
0.86
0.88
Mean Task Rank
9.50
8.44
6.56
7.75
5.75
5.88
7.31
3.12
2.94
2.50
5.31
Table 3: Zero-shot Results (Micro-F1 Scores) for Open-Weight Models. Bold indicates the highest
open-weight model micro-F1 score on a given task. Underlined indicates the highest micro-F1 score
across all models evaluated (inc. GPT-4 series for a subset of tasks). Mean Task Rank is calculated as
the rank of the open-weight model on each task averaged over all tasks. Models ordered by number
of parameters. *Mistral-Large was run in INT-4 AWQ
3.1
