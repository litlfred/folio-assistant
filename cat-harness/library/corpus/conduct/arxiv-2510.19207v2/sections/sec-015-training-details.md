---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-015-training-details
section_title: "Training Details"
section_number: null
pages: 7-7
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
We fine-tune Llama-3.1-8B-Instruct [58] as the
filter model on the Alpaca dataset [59] as described in Sec-
tion IV. The model is fine-tuned with the following objective:
given a pair ⟨u, x⟩of trusted user instruction u and potentially
injected data x, the model learns to remove the injections
and retain the benign data xclean, and to terminate generation
with the end-of-sequence token immediately after the last
trustworthy token without any hallucinated completion.
Training is performed on two 80GB GPUs (A100/H100) us-
ing DeepSpeed ZeRO-3 [61] for memory-efficient distributed
training. We use a batch size per device of 1 and a gradient
accumulation steps of 16 to achieve a large effective batch size.
The learning rate is set to 2×10−5 with a cosine learning-rate
schedule and 100 warmup steps. Training uses BF16 precision
and runs for 300 steps.
