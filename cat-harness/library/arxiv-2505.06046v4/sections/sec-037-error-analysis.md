---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-037-error-analysis
section_title: "Error analysis"
section_number: null
pages: 22-24
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
To understand the categories of errors commonly found in found in free form responses we label the
errors in the incorrect LLM responses using Llama-3.3-70bn into the following three types (Figure
11):
1. The answer adds extraneous information not in the official guidance, without contradicting
it.
2. The answer omits required points from the official guidance (i.e., is missing information).
3. The answer contradicts or misstates the official guidance (i.e., is an incorrect deviation).
22
Preprint.
Table 10: Judge prompt.
System Prompt
You are an expert in UK public health. You are going to evaluate whether a given answer to a public
health guidance question is correct.
Prompt Content
You are tasked with evaluating whether a given answer is correct based on the ground truth answer
and provided context. Carefully analyse the ground truth answer and context and determine whether
the given answer correctly answers the question and aligns with the information given.
—
===========
Question:
===========
{question}
—
===========
Context:
===========
{context}
—
===========
Ground Truth Answer:
===========
{ground truth answer}
—
===========
Given Answer:
===========
{given answer}
—
For the given answer to be correct it must align with the ground truth without omitting any key
details **and** any additional detail in the given answer must be seen in the provided context.
Determine, with reasoning, whether the given answer is correct based on the ground truth answer
and context. Give your response in the following json format:
{{”reasoning”: Why is the answer correct/incorrect, ”predicted correct”: true or false}}
23
Preprint.
Figure 11: Comparison of PubHealthBench-FreeForm error types classified using Llama-3.3-70bn.
A.7.3
