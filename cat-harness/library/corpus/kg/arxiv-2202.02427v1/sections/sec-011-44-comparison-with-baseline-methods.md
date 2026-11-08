---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-011-44-comparison-with-baseline-methods
section_title: "Comparison with baseline methods"
section_number: 4.4
pages: 4-5
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
Table 3 shows the streaming recommendation performance in
terms of recall@20 and nDCG@20 of baseline methods and our
method (including its variants) on the three datasets. The offline
performance refers to the scenario when the offline portion of our
dataset, 𝐺𝑡0 is used for training, while the streaming performance
refers to when the streaming data is used for inference using the
same trained model. In the streaming scenario, we report perfor-
mance after seeing the last chunk of streaming data 𝐺𝑡3. Comparing
the offline and streaming results, almost all the methods are able to
utilize the streaming data effectively to improve streaming perfor-
mance, with the only exception of LightGCN on Yelp dataset.
Our proposed method LCE consistently out-performs all the
baselines, especially when streaming data is available. To test the
statistical significance of the performance gain, we conduct paired
Lightweight Compositional Embeddings
for Incremental Streaming Recommendation
Machine Learning on Graph (MLoG) Workshop at WSDM’22, Feb 25th, 2022, Virtual
Yelp
LibraryThing
Epinions
Recall@20
nDCG@20
Recall@20
nDCG@20
Recall@20
nDCG@20
Top-popu
0.0040
0.0022
0.0009
0.0014
0.0012
0.0007
𝑅𝑃3
𝛽
0.0336
0.0199
0.0049
0.004
0.0048
0.0032
ALS
0.0438
0.0263
0.0215
0.0202
0.0112
0.0105
SLIM
0.0481
0.029
0.028
0.0269
0.0149
0.0134
ENSFM
0.0565
0.0344
0.0265
0.0259
0.0091
0.0079
LightGCN
0.0565
0.0334
0.024
0.0209
0.0152
0.0100
𝐿𝐶𝐸𝑚𝑒𝑎𝑛
0.0651★
0.0387★
0.0299
0.0282
0.0167
0.0144
𝐿𝐶𝐸𝑠𝑢𝑚
0.0620
0.0361
0.0301
0.0283
0.0178★
0.0148
LCE-1 emb
0.0636
0.0380
0.0286
0.0242
0.0153
0.0106
LCE-1 layer
0.0595
0.0349
0.0216
0.0198
0.0095
0.0067
% improvement
+15.22%
+12.50%
+7.50%
+5.20%
+17.11%
+10.45%
Table 3: The streaming performance on three datasets. Our model (LCE) consistently out-performs all the other methods.
LightGCN and SLIM are the two strongest baselines. Numbers with ★represent significant improvement in a paired t-test at
the 𝑝< 0.05 level compared with the best baseline.
t-tests with alternative hypothesis that LCE performs better than
best baseline, and mark Table 3 with ★when 𝑝< 0.05.
Among the baselines, LightGCN and SLIM are the two strongest
models. More specifically, SLIM achieved better nDCG scores than
LightGCN but lower recall scores, meaning that the sparse model
(i.e. SLIM) is not as effective at retrieving all relevant items as it is
for ranking them accurately. Note however that, under the same
embedding dimension, LCE has fewer parameters than LightGCN
when the size of the implicitly embedded node set is larger than
that of the explicitly embedded set (see Table 2). Moreover, LCE
performance is significantly better than LightGCN across the three
datasets. See Appendix Appendix A.5 for more results on model
capacity v.s. performance.
The ENSFM model achieved better performance than SLIM on
Yelp, but not on the other two datasets. Note that we do not have
additional features (e.g., user features) as input which is typical
available for factorization machine-based methods, thus it might
limit the strength of ENSFM in our setting. The shallow models
ALS and the “lazy” approach 𝑅𝑃3
𝛽and top-popu in general perform
worse than the other deep(er) models, which also indicates that
more complex model (i.e. deep, graph-based) can better capture the
signals from past interactions for recommendation.
4.4.1
Utilizing streaming data with incremental updates. To further
investigate if LCE is able to effectively utilize the streaming data
comparing to the skyline performance when retraining with full
data, we compare the streaming performance using incremental up-
dates (the default setting) vs. skyline performance when retraining
the model from scratch with full (i.e. offline + streaming) data.
We show the model performance with incremental updates (solid
lines) and with model retraining (dotted lines) on the three datasets
in Figure 2. Again, we can see that our method LCE consistently
out-performs the three baselines (LightGCN, SLIM, and ALS), and
the gains become larger as more streaming data is available for
incremental updates. Furthermore, comparing the gaps between
the two lines for each method, LCE has the smallest gap compared
to other baselines. For example, on Yelp dataset the skyline perfor-
mance of LCE and LightGCN is very close, but LCE has much better
incremental performance, which means LCE can better utilize the
streaming data even without retraining the model. Note that in-
cremental updates are much more efficient than model retraining.
Each incremental step takes a few seconds for LCE while model
re-training takes a few hours.
4.4.2
Evaluating with cold-start items. Our model LCE is partially
inductive — it can deal with cold-start users or items depending
on the choice of composition direction. We evaluated its recom-
mendation performance when considering cold-start items that
only appears during the streaming window on Epinions and Li-
brary datasets. Both datasets have a long streaming window (12
months), and contains 40862 and 21506 cold-start items respectively.
As LightGCN and ENSFM do not support new items (see Table 5),
we compare to two other strong baselines SLIM and ALS. Figure 3
shows that LCE consistently improves the performance on both
datasets, and is able to utilize the streaming data.
4.5
