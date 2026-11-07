---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-017-53-cold-start-recommendation
section_title: "Cold-start recommendation"
section_number: 5.3
pages: 7-7
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
5.1
Sequential and streaming recommendation
Sequential recommendation models [5, 16, 20, 21, 29, 33, 35] fo-
cus on capturing the temporal dynamics of user-item interactions
which is orthogonal to the problem of incremental recommenda-
tion. Moreover, these methods cannot handle non-bipartite graph
data which we study in this paper. Regarding streaming recommen-
dation, prior work [3, 7, 31] has proposed retraining models with
subsamples of the training set [31] or meta-learning [37]. However,
so far, these techniques are only shown to be effective for shallow
MF models that do not capture higher-order user-item relationships.
Due to the large parameter space and high computational cost of
deep models or graph-based models, retraining-based methods are
not directly applicable. Our work advances the state-of-the-art by
developing a graph-based recommendation model that supports
incremental recommendation.
5.2
