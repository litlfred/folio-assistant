---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-034-pubhealthbench-prompts
section_title: "PubHealthBench prompts"
section_number: null
pages: 21-21
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Table 8: MCQA zero-shot evaluation prompt.
System Prompt
You are an expert working for a Public Health agency.
Prompt Content
The following are multiple choice questions (with answers) about UK Government public health
guidance.
Question: This question relates to UK Health Security Agency (UKHSA) guidance that could be
found on the gov.uk website as of 08/01/2025.
{question}
Options:
{answer options}
Provide the letter (A, B, C, D, E, F, or G) of the correct answer. You should state ”The answer is
(X)”, where the X contained in the brackets is the correct letter choice, make sure you include the
brackets () around your final answer in your response. DO NOT provide any other information or
text in your response.
Answer:
Table 9: Free form evaluation prompt.
System Prompt
You are an expert working for a Public Health agency.
Prompt Content
The following is a question about UK Government public health guidance.
Question: This question relates to UK Health Security Agency (UKHSA) guidance.
{question}
Please answer the question to the best of your knowledge.
Answer:
A.7
