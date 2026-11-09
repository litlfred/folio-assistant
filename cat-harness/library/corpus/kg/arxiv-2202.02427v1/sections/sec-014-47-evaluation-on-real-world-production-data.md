---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-014-47-evaluation-on-real-world-production-data
section_title: "Evaluation on real-world production data"
section_number: 4.7
pages: 7-7
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
In additional to the three public datasets, we also evaluated
LCE on a real-world production system (Microsoft Teams), where
the task is to recommend TEAMs for users to join. We created a
subset of 224K users and 26K TEAMs, with a total of 65 million user
interactions. The interaction graph is constructed from a set of time-
stamped user-item and user-user actions, where the edges represent
interactions between two users (accessing a shared document, email
communication, chatting), or between a user and a TEAM (past
membership). The offline, streaming and test time windows are set
to 3 weeks, 2 weeks and 5 months respectively, and we use daily
slices for streaming data.
For model comparison, we chose LightGCN as the strongest
baseline, and evaluated the offline and streaming performance in
terms of precision@3 and recall@10. The results showed that LCE
achieved competitive offline performance with > 80% fewer model
parameters than LightGCN, and out-performed LightGCN by up to
6.42% on precision@3 when streaming data is available. Further-
more, our results showed that LCE improves with more streaming
data, whereas LightGCN was not able generalize to new data, pos-
sibly due to over-parameterization.
5
