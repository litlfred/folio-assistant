---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-020-65-llm-baseline
section_title: "LLM baseline"
section_number: 6.5
pages: 7-7
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
LLM baseline
We used the latest version of ChatGPT-4o (as of 08.2024) as a base-
line, as it has shown success in similar tasks performed by Zhiwei
et al. in the work [20] and Perot et al. in the work [26]. To do this,
we had to modify the prompt by explicitly specifying the expected
behavior in the absence of the document content by adding the text
"If the review is empty, return ‘Not reviewed’" (fine-tuned models
received this information from the train dataset). In addition, we
also applied an approach based on the use of a prompting tech-
nique known as few-shot learning (the essence of the technique is
to include a small number of labeled examples in the prompt), as it
can greatly improve the performance of the model [4]. In our case,
we include two labeled examples.
In addition, we tested the "base" models on a similarly modified
prompt (without few-shot learning) before fine-tuning.
