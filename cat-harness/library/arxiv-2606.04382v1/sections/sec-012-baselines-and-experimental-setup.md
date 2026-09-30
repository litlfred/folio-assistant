---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-012-baselines-and-experimental-setup
section_title: "Baselines and experimental setup"
section_number: null
pages: 8-8
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
We establish reference systems on the development
set; the neural systems are run on a deterministic,
language-stratified 2,002-record subset of the 18,993-
record development set (the full neural run is deferred
for cost).
• Frequency floor. Predict the 200 globally most-
frequent development headings for every record
— a trivial, input-independent baseline that ex-
poses head-heavy exploits.
• Stock on-device embedder. EmbeddingGemma-
300M embeddings over the full vocabulary at the
deployed 256 dimensions — a strong, free, fully
local retriever, untouched.
• Hosted
embedders.
OpenAI
text-embedding-3-small
(1,536-d)
and
text-embedding-3-large
(3,072-d)
retrieval
over the same vocabulary.
• Fine-tuned
on-device
embedder
(this
work).
The same EmbeddingGemma-300M backbone,
adapted with a low-rank fine-tune described in
Section 3.11.1, used as a drop-in first-stage re-
triever at 256 dimensions. It is the only system
trained on the benchmark’s own records, under
a strict leakage protocol.
