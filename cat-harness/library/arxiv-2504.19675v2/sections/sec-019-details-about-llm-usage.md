---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-019-details-about-llm-usage
section_title: "Details about LLM usage"
section_number: null
pages: 7-7
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
We used the vLLM10 inference engine to translate
and synthesise records using the Llama-3.1-8B-
Instruct LLM. For the processing, we used a single
NVIDIA A100 GPU with 80GB VRAM from the
University of Helsinki HPC cluster Turso.
For translating GND into English, we used the
GPT-4o-mini LLM on the Azure OpenAI Service
cloud platform.
D.1
Performance
Using vLLM, we achieved a throughput of ap-
proximately 4 records/second for translation and 8
records/second for synthesising new records.
D.2
