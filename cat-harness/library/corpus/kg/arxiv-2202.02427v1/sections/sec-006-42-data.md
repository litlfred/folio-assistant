---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-006-42-data
section_title: "Data"
section_number: 4.2
pages: 2-3
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
set of all parameters in our model. We initialize the matrices of
Lightweight Compositional Embeddings
for Incremental Streaming Recommendation
Machine Learning on Graph (MLoG) Workshop at WSDM’22, Feb 25th, 2022, Virtual
Offline training
Incremental updates
Test data
Time
A
C
D
A
C
D
B
A
C
D
B
t0
tK
tfinal
t1
...
B
E
E
Figure 1: An example graph illustrating the streaming scenario we are addressing in this paper. Given a graph at time 𝑡0 —
here, between users and books — new edges (blue) and items node (here: book E) arrive at timesteps 𝑡1,𝑡2, . . . , which the model
has to take into account when making predictions for edges in the final graph at 𝑡𝑓𝑖𝑛𝑎𝑙.
explicit embeddings (Z𝑈, ˜Z𝑈) with random entries and then update
later during training them via back propagation. In Eq.3, we use
the initial snapshot 𝐺𝑡0 for the graph 𝐺. We learn all parameters of
our model via an auxiliary prediction task where we sample a few
target edges from the training edges 𝐸𝑡𝑟𝑎𝑖𝑛in each epoch which
we will try to reconstruct from the remaining input edges. We use
the Bayesian Personalized Ranking (BPR) loss to encourage the
relevant items to be ranked higher than the other items, as shown
in Eq.5. This is equivalent to maximizing the likelihood of existing
user-item edges with negative sampling,
ˆΘ = arg max
Θ
∑︁
𝑢∈𝑈
∑︁
𝑤∈
N𝑊(𝑢; 𝐺)
∑︁
𝑤′∉
N𝑊(𝑢; 𝐺)
ln𝜎(˜z𝑇
𝑢z𝑤−˜z𝑇
𝑢z𝑤′)
+ 𝜆∥Θ∥2
(5)
where N𝑊(𝑢; 𝐺) represents the set of neighbors with type 𝑊in
the training graph G, which are essentially items that the user 𝑢
has interacted with in the past. We use a separate validation set for
hyperparameter search and refer to the appendix for details of the
training procedure. Note model parameters Θ = {˜𝑧𝑢,𝑧𝑢}𝑢∈𝑈are
optimized with Eq. 5 and Eq. 2-4 show how to compute 𝑧𝑤from 𝑧𝑢.
3.3
