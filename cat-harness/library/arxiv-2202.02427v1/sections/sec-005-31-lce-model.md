---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-005-31-lce-model
section_title: "LCE model"
section_number: 3.1
pages: 2-2
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
on the training set, propagating information from embeddings via
simplified GCN layers. Afterwards, during each incremental update
step, we re-compute the compositional embeddings with the new
edges from each step and also compute new prediction scores.
3.1
LCE model
We start with a general description of the LCE model before
turning to training and inference details. For ease of exposition, let
us assume that we chose to learn explicit embeddings for 𝑢∈𝑈
and represent 𝑤∈𝑊implicitly through a composition function.
LCE then represents each user 𝑢via a pair of explicit embeddings
(z𝑢, ˜z𝑢) ∈R𝑑×R𝑑, enabling the model to use different embeddings
for aggregation and scoring. Large letters denote matrices, e.g., Z𝑈
is the matrix one obtains by concatenating all z𝑢from 𝑈. Let us
use z𝑤to denote the compositional embedding of 𝑤∈𝑊that
are derived from Z𝑈via the graph interactions. Given representa-
tions (z𝑢, ˜z𝑢) and z𝑤, we model the probability of an edge existing
between user 𝑢and item 𝑤as
𝑆(𝑢,𝑤) = 𝜎(˜z𝑇
𝑢z𝑤),
(1)
where 𝜎is the well-known sigmoid function.
Inference. To generate recommendations we compute the scores
𝑆(𝑢,𝑤) for user 𝑢on all items 𝑤, and sort them in descending order
to produce a ranking 𝑤(1),𝑤(2), . . . ,𝑤( |𝑊|).
Compositional embeddings. To generate embeddings z𝑤for each
𝑤∈𝑊, LCE follows the process in Eq.3. First, we compose the
initial embeddings for each item𝑤∈𝑊by aggregating embeddings
from the incoming edges of 𝑤within a given graph 𝐺:
z(0)
𝑤
= 𝑓({z𝑢}𝑢∈N𝑈(𝑤;𝐺))
(2)
Here, N𝑈(𝑤;𝐺) is the set of neighboring users for item 𝑤, and 𝑓(·)
is a composition function (e.g. mean pooling, sum pooling) which
generates the input layer embedding z(0)
𝑤as the average or sum of
the explicit embeddings z𝑢according to past user-item interactions.
The impact of this choice is generally small as our empirical result
shows, but we note that this is an additional hyperparameter that
can be optimized.
𝐺denotes the adjacency matrix of a graph which will be specified
in the following two subsections. We stack 𝐿graph convolution
layers to pass around information from the neighborhood. For each
node 𝑣∈𝑈∪· 𝑊, we compose its embedding z𝑣as follows:
z(1)
𝑣
= 𝑎𝑔𝑔({z(0)
𝑣′ }𝑣′∈N𝐺(𝑣; 𝐺))
. . .
z(𝐿)
𝑣
= 𝑎𝑔𝑔({z(𝐿−1)
𝑣′
}𝑣′∈N𝐺(𝑣; 𝐺)
(3)
z𝑤= 𝑎𝑣𝑔(z(0)
𝑤, z(1)
𝑤, · · · , z(𝐿)
𝑤)
(4)
where N𝐺(𝑣; 𝐺) is the set of all the neighbors for node 𝑣in graph G
that might include both users and items. The 𝑎𝑔𝑔function denotes
an aggregation function corresponding to a graph convolution
operator which generates 𝑙-th layer’s node representation from
(𝑙−1)-th layer’s representation of the target node and its neighbor
nodes.
Note that the convolution function (Eq.3) is applied for all nodes,
but the final composition (Eq.4) is only used to calculate implicit
embeddings for nodes 𝑊. Similar to LightGCN [10] which showed
that typical aggregation functions can be suboptimal in recommen-
dation tasks, we adopt a simplified design for the convolution layers
where the aggregation function is mean pooling and the layer-wise
transformation function is simply the identity mapping.
3.2
Offline batch training
As mentioned before, we train the model once on a batch of
