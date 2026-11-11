---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-004-32-offline-batch-training
section_title: "Offline batch training"
section_number: 3.2
pages: 2-2
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
model goes through 𝐾rounds of online incremental updates
where it observes new edges and nodes as it is asked to produce
updated predictions. More specifically, the prediction target is the
edge set 𝐸𝑡𝑓𝑖𝑛𝑎𝑙−𝐸𝑡𝐾and the goal is to condition predictions on
the graph𝐺𝑡𝐾, even though we can only estimate model parameters
on 𝐺𝑡0.
Figure 1 illustrates the incremental streaming scenario with an
evolving user-book graph where user-user edges represent trust
relations and user-book edges indicate read books. The middle
graph corresponds to an intermediate update step 𝑡𝑖where a new
book E and three blue dotted edges were added to the graph. The
rightmost graph represents the final graph 𝐺𝑓𝑖𝑛𝑎𝑙where the green
edges were added and also form the prediction target.
3
LIGHTWEIGHT COMPOSITIONAL
EMBEDDINGS
The key idea of our approach, Lightweight Compositional Em-
beddings (LCE), is to only explicitly learn embeddings for one set
of nodes – either 𝑈or 𝑊– and then compute representations for
the other set of nodes via a composition function. In practice, one
would typically choose to represent the smaller node set (either
𝑈or 𝑊) explicitly. This enables LCE to efficiently update under a
streaming setting, as well as substantially reduces overall model
size. During the offline initialization step, we fit the explicit em-
