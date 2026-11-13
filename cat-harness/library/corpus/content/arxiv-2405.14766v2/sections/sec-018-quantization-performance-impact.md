---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-018-quantization-performance-impact
section_title: "Quantization Performance Impact"
section_number: null
pages: 14-15
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
The significant memory requirements of LLMs means a range of model quantization methods
have been explored to reduce the total footprint of a model with a given number of parameters.
These approaches change the format and precision in which the model parameters are stored
to reduce the number of bits required for each parameter. However, the trade-off is that
quantization will also impact model behavior, potentially degrading performance when
compared to the model in its original format.
Llama-3.1-8B diff (ppts)
Llama-3.1-70B diff (ppts)
Llama-3.3-70B diff (ppts)
Task Name
NCBI Disease Extraction
1.4
-1.2
1.0
GI Classification
2.5
0.0
0.0
GI Symptom Extraction
0.0
-0.8
-0.4
ICD-10 Description Classification
-4.1
0.2
-0.2
News Headline Classification
-0.9
-0.2
-0.5
Guidance Topic Classification
-4.2
1.5
0.3
BioDex Drugs Extraction
-0.4
0.6
0.3
Health Advice
-0.6
-1.5
-0.5
Guidance Recommendations
2.0
0.0
-1.3
Causal Relations
-8.8
-1.7
-2.4
PubMedQA
0.6
0.0
0.1
Contact Classification
-4.3
0.8
-1.6
Country Disambiguation
-1.3
0.1
0.0
Food Extraction
0.8
-0.1
0.4
MMLU Genetics
-2.1
-1.1
2.2
MMLU Nutrition
-1.5
-0.3
0.0
Avg INT-4 AWQ vs FP16 Diff
-1.3
-0.2
-0.2
Table 5: INT-4 AWQ Quantization Impact on Micro-F1 Scores. All numbers are the percentage
point difference between the micro F1 score for the FP16 model and the INT-4 AWQ quantized model
on the given task.
To understand this trade-off on our tasks, we explore the performance impact of INT-4
Activation Aware Quantization (AWQ) [67] on three of the Llama 3 family of models.
14
This quantization approach reduces the memory requirement for model parameters by
approximately 70%.
As shown in 5, despite the large reduction in model size, we find limited impact of INT-4
AWQ quantization across Llama 3.1 8bn, Llama 3.1 70bn, and Llama 3.3 70bn. The largest
performance degradation was found for Llama 3.1 8bn with an average reduction in Micro-F1
score of 1.3% percentage points across the 16 tasks.
4
