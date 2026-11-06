---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-003-2-problem-formulation-and-notation
section_title: "Problem Formulation and Notation"
section_number: 2
pages: 2-2
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
In this paper, we develop and evaluate our method in what we
call the incremental streaming setting. In it, we assume that there
exists some fixed future graph 𝐺𝑓𝑖𝑛𝑎𝑙= (𝑉𝑓𝑖𝑛𝑎𝑙, 𝐸𝑓𝑖𝑛𝑎𝑙) whose
edges form the target of our prediction. Nodes are split into two
types (users and items), 𝑉= 𝑈∪· 𝑊with no edges between items as
item-item interactions are rare in practice. We do not get to observe
the entire set of edges 𝐸𝑓𝑖𝑛𝑎𝑙or nodes 𝑉𝑓𝑖𝑛𝑎𝑙at the start but only
subsets of them 𝐸𝑡0 (or 𝑉𝑡0) at the beginning – at a point in time
we denote with 𝑡0. Now, as time moves forward, we get to see an
increasing number of edges 𝐸𝑡0 ⊆. . . 𝐸𝑡𝐾and nodes 𝑉𝑡0 ⊆. . .𝑉𝑡𝐾
from 𝐺𝑓𝑖𝑛𝑎𝑙. This process can also be seen as sampling without
replacement from the edge set and nodes sets of 𝐺𝑓𝑖𝑛𝑎𝑙. We assume
a partially inductive setting, where new nodes of only a certain
type (i.e. user or item) can arrive over time, and the other type of
nodes are known at 𝑡0, i.e., 𝑉𝑡𝑖= 𝑊𝑡𝑖∪· 𝑈𝑓𝑖𝑛𝑎𝑙.
We assume that we are allowed to train a model once for 𝑡0,
