---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-035-free-form-evaluation---llm-as-a-judge-setup
section_title: "Free form evaluation - LLM as a Judge setup"
section_number: null
pages: 21-22
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
To provide an accurate but cost effective LLM judge to assess unstructured free form LLM re-
sponses, we frame it as a binary classification task for whether the free form responses align with
the correct answer and source text.
We provide the judge with the guidance source text that was used to generate the question. This
ensures the judge always has access to the ground truth information. To allow the judge to correctly
evaluate answers that may include additional information that relates to other aspects of UK public
health guidance, we provide 5 additional chunks of relevant guidance in the prompt. These 5 ad-
21
Preprint.
ditional chunks for each question are retrieved from the full corpus using a hybrid retrieval system
that ranked relevance by combining the cosine similarities of text embedding vectors (OpenAI’s
text-3-embedding-large model) and TF-IDF vectors, between each chunk and a given question.
Finally, to guide the judge to the most important information to include, we also provide the MCQA
correct answer option. The full LLM judge CoT prompt combining these components is shown in
Table 10.
To create a judge evaluation dataset and assess the performance of the LLM judge, we utilise the
already generated correct and incorrect MCQA answer options. We insert the known correct or
incorrect answer option into a variety of free form chat response templates designed to simulate the
structure of LLM free form responses. We assess the ability of the judge to distinguish whether the
response is valid using the provided source text.
In this paper we use gpt-4o-mini-2024-07-18 as the main judge with greedy decoding, which
achieved over 99% accuracy on the judge evaluation set (10,517 samples). Further details of this
LLM judge evaluation approach will be published in upcoming work.
A.7.1
