---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-013-46-explicit-vs-implicit-embeddings
section_title: "Explicit v.s. implicit embeddings"
section_number: 4.6
pages: 6-7
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
One important assumption of our model is that one node type
is more amenable to “static” representation than the other, so we
learn a static representation for that node type (e.g, users) and learn
an implicit, compositional function to calculate the representation
of the other nodes (e.g, items). In our earlier experiments, we con-
sidered the smaller node set to be the more static one, which is
the set of users in all the three datasets. We also tried the reverse
(i.e. explicitly embedding items and using a compositional func-
tion for users). Let the embedding dimension of LCE-item be 𝑑𝑖𝑡𝑒𝑚.
Since the LCE-item model learns two explicit embeddings for each
user, the number of parameters is 𝐷= 2𝑑𝑖𝑡𝑒𝑚|𝑢𝑠𝑒𝑟𝑠|. When we
learn explicit embeddings for items (LCE-user (equal 𝐷)), we set
𝑑𝑢𝑠𝑒𝑟= |𝑢𝑠𝑒𝑟𝑠|
|𝑖𝑡𝑒𝑚𝑠| × 𝑑𝑖𝑡𝑒𝑚so the total number of parameters is held
constant, ie. 2𝑑𝑢𝑠𝑒𝑟|𝑖𝑡𝑒𝑚𝑠| = 𝐷. To measure the effect of increasing
Lightweight Compositional Embeddings
for Incremental Streaming Recommendation
Machine Learning on Graph (MLoG) Workshop at WSDM’22, Feb 25th, 2022, Virtual
the parameterization (since the |𝑖𝑡𝑒𝑚𝑠| > |𝑢𝑠𝑒𝑟𝑠|) we also consider
𝑑′𝑢𝑠𝑒𝑟= 2𝑑𝑢𝑠𝑒𝑟for LCE-user (larger 𝐷). The results are shown in
Table 4, where we can see implicitly embedding users (“LCE-user”)
performed significantly worse, regardless of whether the parameter
size is increased.
In addition, we test the assumption of stationarity by measuring
the robustness of past embeddings. Since measuring stationarity
directly is challenging, we use robustness as a proxy. Specifically, we
split the training data into four equal-sized buckets {𝐷1, 𝐷2, 𝐷3, 𝐷4}
in chronological order, and then we use 𝐷1 to learn explicit users
embeddings 𝑍𝑈
1 and item embeddings 𝑍𝐼
1 with a LightGCN model.
To test robustness, we fix the embedding for one node type (i.e. user
embedding 𝑍𝑈
1 ) and re-learn the embeddings for the other type (i.e.
item embedding 𝑍𝐼
2,𝑍𝐼
3,𝑍𝐼
4) on data 𝐷2, 𝐷3 and 𝐷4 respectively. For
evaluation, the learned embeddings are used to predict the future
edges between users and items.
In Figure 4 we can see that updating item embeddings (i.e. fix
user embeddings) achieved consistently better performance than
updating user embeddings, which means the information loss from
using old data is more significant for items, and thus we conclude
that item nodes are more non-stationary in these datasets. This
provides empirical validation of our assumption that an implicit,
compositional function can be used to represent node types that are
more non-stationary (to update their representation dynamically)
and that it is only necessary to learn explicit representations for
node types that are more stationary.
4.7
