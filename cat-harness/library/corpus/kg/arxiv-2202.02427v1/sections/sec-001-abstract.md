---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-001-abstract
section_title: "Abstract"
section_number: null
pages: 1-1
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
Most work in graph-based recommender systems considers a
static setting where all information about test nodes (i.e., users and
items) is available upfront at training time. However, this static
setting makes little sense for many real world applications where
data comes in continuously as a stream of new edges and nodes,
and one has to update model predictions incrementally to reflect
the latest state. To fully capitalize on the newly available data in the
stream, recent graph-based recommendation models would need to
be repeatedly retrained, which is infeasible in practice. In this pa-
per, we study the graph-based streaming recommendation setting
and propose a compositional recommendation model—Lightweight
Compositional Embedding (LCE)—that supports incremental up-
dates under low computational cost. Instead of learning explicit
embeddings for the full set of nodes, LCE learns explicit embed-
dings for only a subset of nodes and represents the other nodes
implicitly, through a composition function based on their interac-
tions in the graph. This provides an effective, yet efficient, means
to leverage streaming graph data when one node type (e.g., items)
is more amenable to static representation. We conduct an extensive
empirical study to compare LCE to a set of competitive baselines
on three large-scale user-item recommendation datasets with inter-
actions under a streaming setting. The results demonstrate the su-
perior performance of LCE, showing that it achieves nearly skyline
performance with significantly fewer parameters than alternative
graph-based models.
1
