---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-010-41-replay-protocol
section_title: "Replay protocol"
section_number: 4.1
pages: 3-4
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
For the overall experimental setup, we implemented the scenario
introduced in Section 2 as follows. There are three larger splits of
the data – an offline dataset to train (𝐺𝑡𝑟𝑎𝑖𝑛
𝑡0
) on with a validation
set (𝐺𝑣𝑎𝑙
𝑡0 ), 𝐾different chunks of streaming data (𝐺𝑡𝑖), and the test
data (𝐺𝑓𝑖𝑛𝑎𝑙). This is also shown in Figure 1.
For each method to evaluate, we first train a model 𝑀𝑡0 using
the training portion offline data 𝐺𝑡0, and pick the best hyperpa-
rameters on the validation test 𝐺𝑣𝑎𝑙
𝑡0 . During the streaming phase,
we regard the model parameters as fixed and only feed new in-
puts 𝐺𝑡𝑖,𝑖= 1, . . . , 𝐾to the model 𝑀𝑡0. We will also report skyline
performance later which is the performance of a model that was
completely retrained with all data up to and including 𝐺𝑡𝑖. Let 𝑀𝑡𝑖
denote the skyline model one gets from the latter. To measure rec-
ommendation performance, we rank all possible user-item edges
by their scores and measure quality with respect to all new edges
in the final graph, 𝐺𝑓𝑖𝑛𝑎𝑙\ 𝐺𝑡𝐾. We report test set performance
as recall@𝑁and nDCG@𝑁, with both being common metrics in
top-𝑁recommendation.
4.2
Data
We consider the following three datasets for our experiments
whose statistics are shown in Table 1. They differ in the time span
and user/item ratio, and the user-item graph density. For example,
the Yelp dataset contains the reviews from 20K users for 37K items
over the time period of three years, whereas the Epinions dataset
contains much sparser user-item interactions with fewer users
(∼10K) but more items (∼88K) over ten years. More details about
each dataset are listed below:
Machine Learning on Graph (MLoG) Workshop at WSDM’22, Feb 25th, 2022, Virtual
Hang and Schnabel, et al.
Dataset
Yelp
Epinions
LibraryThing
# users
20,458
10,277
16,894
# items
37,552
87,791
59,079
graph density
0.079%
0.023%
0.037%
offline window
24 months
48 months
50 months
streaming window
3 months
12 months
12 months
test window
6 months
5 years
3 years
Table 1: Density, user-item ratios, and temporal window
sizes (used for creating data splits) for the three datasets we
used during evaluation.
method
architecture
embeddings
model size
𝑅𝑃3
𝛽
RW
none
ALS
MF
user + item
(|𝑈| + |𝑊|) × 𝑑
SLIM
MF
item
|𝑊| × |𝑊|
ENSFM
Deep MF
user + item
(|𝑈| + |𝑊|) × 𝑑
LightGCN
GNN
user + item
(|𝑈| + |𝑊|) × 𝑑
LCE
GNN
user or item
2|𝑈| · 𝑑
Table 2: Properties of baselines used in our experiment. We
compare to a mix of classic factorization-based approaches
and deep/graph-based models. RW=“random walk”.
Yelp. The Yelp dataset is adopted from the latest Yelp challenge∗
which includes time-stamped reviews from Yelp users from
the year of 2017 to 2019. The local businesses like restau-
rants and bars are viewed as the items, and the user-item
interactions are reviews given to the restaurants.
Epinions. This dataset contains timestamped product reviews and
the trust network amongst users [28]†.
LibraryThing. Dataset including book ratings and social relation-
ships between users, from Aug. 2005 to Aug. 2013 [2]‡.
As the number of items are much more than number of users
in the three datasets, we learn explicit embeddings for users and
compositional embeddings for items to have a more compact model.
§ Also, since some baseline models (e.g. LightGCN, ENSFM) do
not support cold-start items, we primarily consider a transductive
setting where all items and users are known during offline training,
and also introduce a partially inductive setting, which includes
cold-start items, for evaluation in Sec. 4.4.2.
4.2.1
Data splits. To create the splits mentioned in Figure 1, we
split the user-item interactions by their timestamps into three sets
(i.e. offline, streaming and test) and use all the user-user edges for
offline training. The last 10% of the offline data makes up the valida-
tion set used for hyper-parameter tuning. The overall proportions
were chosen so as to ensure that (i) we have enough users from
𝐺𝑓𝑖𝑛𝑎𝑙that also appear in 𝐺𝑡0 and (ii) have enough observations to
perform the incremental streaming updates. The streaming portion
was divided into three equally sets 𝐺𝑡1,𝐺𝑡2, and 𝐺𝑡3, and we assess
∗https://www.yelp.com/dataset
†https://www.cse.msu.edu/ tangjili/trust.html
‡https://cseweb.ucsd.edu/ jmcauley/datasets.html
§See Section 4.6 for an empirical assessment of the explicit v.s. implicit settings.
model performance under increasing amounts of streaming data
in Section 4.4.1. The specific split sizes are shown in the bottom
part of Table 1.
4.3
Baselines
We consider both popular recommendation methods (ALS, SLIM,
ENSFM, etc.) and graph-based method (LightGCN). Table 2 lists
the characteristics of the various baselines and our model. These
methods differ in structure (i.e. shallow v.s. deep or graph-based),
model parameterization (i.e. whether explicitly learn user/item
embeddings) resulting in the difference in model parameters.
The implementation details (e.g. hyper-parameter tuning) of each
baseline method can be found in the appendix. For fair comparison,
we feed matrix-factorization based algorithms a user-(item ∪user)
matrix by concatenating the user-user interaction matrix with the
user-item matrix.
• Top-Popu: recommend most popular items.
• Alternative Least Squares (ALS) [11, 27].
• Efficient Non-sampling Factorization Machines (ENSFM) [4]. We
represent the user-item graph as one-hot feature vectors.
• 𝑅𝑃3
𝛽[6]: a graph vertex ranking recommendation method that re-
ranks items based on 3-hop random walk transition probabilities.
• Sparse Linear Method (SLIM) [19]. SLIM is one of the most com-
petitive baselines in top-𝑁recommendation.
• LightGCN [10]: LightGCN is a state-of-the-art graph-based model
for collaborative filtering. To leverage the social network informa-
tion, we feed the heterogeneous graph including both user-item
and user-user edges instead of the bipartite graph considered in
the original paper.
• LCE variants: In our ablation study (see Section 4.5), we compare
to two variants of our model: "LCE-1 emb" and "LCE-1 layer".
"LCE-1 emb" does not have a separate user embedding for scoring
user-item pairs, but uses the user embedding generated by GCN
layers instead (i.e., setting z𝑢with Equation (4)). "LCE-1 layer"
uses a single GCN layer instead of three layers.
To test each of these methods, we adopt the same temporal
data split and the incremental replay evaluation protocol. The only
exception is for ENSFM [4] method. Since it does not support in-
cremental updates, we retrain the model from scratch using both
offline and streaming data for the streaming setting.
4.4
