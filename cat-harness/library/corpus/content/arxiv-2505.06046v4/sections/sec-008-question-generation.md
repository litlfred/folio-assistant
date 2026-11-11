---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-008-question-generation
section_title: "Question generation"
section_number: null
pages: 4-4
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
Guidance documents often contain significant background information and operational details that
do not directly relate to UK public health recommendations. Therefore, in order to generate relevant
questions we first use an LLM to classify each chunk into whether it contains a public health recom-
mendation and filter out any chunks that do not. We also filter out chunks exceeding ˜2000 words.
This reduces the total number of chunks to 7,946, which form the source material for our MCQA
generation.
We then use an LLM (Llama-3.3-70bn-Instruct) to generate two multiple choice questions per chunk
in the standard MCQA format (Figure 2), with: a single question, single correct answer option, and
six incorrect distractor options per question. We use a one-shot with Chain of Thought (CoT) prompt
instructing the LLM to output its final answer as a JSON (see Appendix A.3). To ensure the LLM
has the required context it is also provided with the text chunks that appear either side of the target
chunk in the document (whether or not these contain recommendations). We run this pipeline across
all of the filtered text chunks generating 15,666 correctly formatted candidate MCQA samples.
3.4
