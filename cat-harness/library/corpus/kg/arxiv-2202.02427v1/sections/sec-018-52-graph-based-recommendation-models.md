---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-018-52-graph-based-recommendation-models
section_title: "Graph-based recommendation models"
section_number: 5.2
pages: 7-7
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
Leveraging graphs to support recommendation scenarios is an
emerging research theme. The core idea is to cast recommenda-
tion problem to graph link prediction. Prior work explored many
graph neural network architectures, for example GraphSage [9, 36].
NGCF [32] and LightGCN [10] learn convolutional structures over
embeddings for all users and items. These models are not generally
applicable to the incremental streaming recommendation setting
that this paper studied, because they require either auxiliary fea-
tures [9, 36] or explicit embeddings for all nodes [10, 32]. Our work
follows the line of graph-based recommenders, but the novel design
of compositional embedding allows LCE to readily incorporate new
data incrementally. Our experiments show that LCE significantly
outperforms state-of-the-art baselines like LightGCN [10].
5.3
Cold-start recommendation
Cold-start is a common problem faced by recommendation sys-
tems [17, 23], and it refers to the difficulty of recommending items
for users with a limited number of interactions. Similar to the
compositional embedding proposed in this paper, some prior non-
graph models [15, 24, 26] represented users using the items they
interacted with to address the cold-start problem. However, the
cold-start problem is complementary to the streaming setting that
we study in this paper, as it assumes static setting where recommen-
dation performance is plotted against the number of observations
that a user or item has. Our proposed method LCE can deal with
new entities (users or items) as long as they are in the set of nodes
whose embeddings are generated compositionally, and we show
that LCE is able to improve over the performance of MF and SLIM
in the presence of cold-start items. Moving towards a fully induc-
tive setting where both new users and items are considered, the
compositional function can be defined on a set of stationary objects
or node attributes.
6
