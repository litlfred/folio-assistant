---
doc_id: arxiv-2405.14766v2
doc_title: "Evaluating Large Language Models for Public Health Classification and Extraction Tasks"
section_id: sec-027-disease-and-health-issue-classification-and-extr
section_title: "Disease and Health Issue Classification and Extraction"
section_number: null
pages: 30-31
source_pdf: arxiv-2405.14766v2.pdf
source_sha256: 07248c8e1578d9ea
toc_source: outline
---
Classifying and extracting potential diseases and health issues from free text is an important
task within public health analysis and has significant overlap with the Medical domain.
Zhang et al. [68] evaluate ChatGPT (GPT-3.5) and GPT-4 at the single label task of disease
classification from electronic health records (EHRs). GPT-4 with zero-shot prompting was
found to achieve between 0.75 and 0.96 F1 score across the 5 diseases and outperformed
GPT-3.5 on 4 of the 5 diseases. Sensitivity analysis suggested few-shot with Chain of
Thought (CoT) prompting improved GPT-4’s performance.
Similarly, Guo et al. [70] evaluate GPT-4 and GPT-3.5 (along with fine-tuned classifiers)
across six single label health information classification tasks using manually annotated
Twitter (now called X) data and data from the Social Media Mining for Health Applications
(SMM4H) datasets. As found in other work, GPT-4 outperforms GPT-3.5 using zero-shot
prompting but with a high variance across tasks, with F1 scores ranging from 0.35 and 0.8.
Finally, due to the importance of novel pathogens within public health, the literature dealing
with rare diseases (where information in the LLM pre-training data is likely to be more
limited) is particularly interesting for LLM evaluation.
Chen et al. [10] introduce RareBench to evaluate LLMs’ (including GPT-4, GPT-3.5, Gemini,
Llama-2-7b and Mistral-1-7b) ability to perform rare disease phenotype extraction, screening,
and diagnosis. GPT-4 is found to have the highest performance across all tasks using zero-
shot prompting while the smaller 7b parameter open-weight Llama-2 and Mistral-1 models
have the lowest scores.
Shyr et al. [30] evaluate ChatGPT for extracting rare diseases, signs and symptoms using
the the RareDis corpus [104]. ChatGPT with zero-shot prompting and relaxed matching
achieves overall F1 scores of 0.41 to 0.47, but with significant variation across types from
0.15 (symptoms) to 0.76 (rare diseases). Few-shot prompting was generally found to lead to
better performance. The complexity of the labels meant that evaluation approaches requiring
exact matching of outputs and labels had significantly worse results.
30
6.2.2
