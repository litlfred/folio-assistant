---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-012-45-comparison-with-lce-variants
section_title: "Comparison with LCE variants"
section_number: 4.5
pages: 5-6
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
The two important features of our model architecture are (1)
using two separate user embeddings for generating item embed-
dings (Z𝑈) and scoring ( ˜Z𝑈) respectively, and (2) stacking multiple
graph convolutional layers to capture long-range dependencies
in the user-item interaction graphs. We performed two ablation
studies to investigate the benefits of the two features.
In Table 3, we can see that the single embedding variant (denoted
as “LCE-1 emb”) performs slightly worse than the original LCE,
which reveals the benefits of separating the two steps (i.e. embed-
ding generation and scoring). Meanwhile, “LCE-1 emb” achieves
comparable or better performance than LightGCN, especially in
streaming setting, which shows the benefit of introducing composi-
tional embeddings and reconstruction-based objective function. Fur-
thermore, the single GCN layer variant (denoted as “LCE-1 layer”)
also achieved suboptimal performance compared to the original
Machine Learning on Graph (MLoG) Workshop at WSDM’22, Feb 25th, 2022, Virtual
Hang and Schnabel, et al.
0
1 month
2 month
3 month
streaming data size 
0.045
0.050
0.055
0.060
0.065
recall
LCE (incremental)
LCE (skyline)
LightGCN (incremental)
LightGCN (skyline)
SLIM (incremental)
SLIM (skyline)
ALS (incremental)
ALS (skyline)
(a) Yelp
0
4 month
8 month
12 month
streaming data size 
0.018
0.020
0.022
0.024
0.026
0.028
0.030
0.032
recall
LCE (incremental)
LCE (skyline)
LightGCN (incremental)
LightGCN (skyline)
SLIM (incremental)
SLIM (skyline)
ALS (incremental)
ALS (skyline)
(b) LibraryThing
0
4 month
8 month
12 month
streaming data size 
0.011
0.012
0.013
0.014
0.015
0.016
0.017
0.018
0.019
recall
LCE (incremental)
LCE (skyline)
LightGCN (incremental)
LightGCN (skyline)
SLIM (incremental)
SLIM (skyline)
ALS (incremental)
ALS (skyline)
(c) Epinions
Figure 2: Incremental (solid lines) and skyline (dotted lines) performance of various methods on Yelp (2a), LibraryThing (2b)
and Epinions (2c) datasets. LCE refers to one of 𝐿𝐶𝐸𝑚𝑒𝑎𝑛or 𝐿𝐶𝐸𝑠𝑢𝑚variants with better validation performance (𝐿𝐶𝐸𝑠𝑢𝑚for
both datasets). On Yelp and Librarything datset, our model LCE is comparable or slightly better than the best baseline (i.e.
LightGCN) when no streaming data is available, but gain becomes larger as more data comes in. The smallest gap between the
two lines of our model reveals its ability to utilize streaming data via incremental updates. On Epinions dataset, our model is
consistently better than the best baseline (i.e. LightGCN).
0
4 month
8 month
12 month
streaming data size 
0.012
0.014
0.016
0.018
0.020
0.022
Performance
LCE (nDCG@20)
LCE (recall@20)
SLIM (nDCG@20)
SLIM (recall@20)
ALS (nDCG@20)
ALS (recall@20)
(a) LibraryThing
0
4 month
8 month
12 month
streaming data size 
0.006
0.007
0.008
0.009
0.010
Performance
LCE (nDCG@20)
LCE (recall@20)
SLIM (nDCG@20)
SLIM (recall@20)
ALS (nDCG@20)
ALS (recall@20)
(b) Epinions
Figure 3: Recommendation performance considering cold-
start items of various methods on LibraryThing (3a) and
Epinions (3b). LCE consistently improves the performance
on both datasets compared with SLIM and ALS. Note that
LightGCN and ENSFM do not support new items.
LCE with three layers, which shows the effectiveness of modeling
long-range dependency in the graph by applying multiple GCN
layers. Note that the number of layers is also a hyper-parameter,
and we can fully expect to further boost the LCE performance by
searching in a larger space.
Besides, the choice of composition function 𝑓(·) is a hyper-
parameter in our model. We compared two common composition
functions 𝑎𝑣𝑔and 𝑠𝑢𝑚on the three datasets, with the performance
shown as 𝐿𝐶𝐸𝑚𝑒𝑎𝑛and 𝐿𝐶𝐸𝑠𝑢𝑚in Table 3. We can see that both
variants achieved comparable performance.
Yelp
LibraryThing
Epinions
LCE-item
0.0387★
0.0283★
0.0148★
LCE-user (equal 𝐷)
0.0320
0.0235
0.0109
LCE-user (larger 𝐷)
0.0322
0.0248
0.0111
Table 4: The recommendation performance of LCE with dif-
ferent implicit (compositional) embeddings listed in blue.
LCE-item is the best performing LCE in Table 3. Numbers
with ★represent significant improvement in a paired t-test
at the 𝑝< 0.05 level compared with the best baseline.
Bucket 1
Bucket 2
Bucket 3
Bucket 4
Data
0.02
0.03
0.04
0.05
0.06
0.07
recall / ndcg
update item (recall)
update item (ndcg)
update user (recall)
update user (ndcg)
Figure 4: Recommendation performance on Yelp dataset
when updating embeddings for only user or item nodes. The
superior performance of updating item embeddings vali-
dates our assumption that items are more non-stationary.
4.6
