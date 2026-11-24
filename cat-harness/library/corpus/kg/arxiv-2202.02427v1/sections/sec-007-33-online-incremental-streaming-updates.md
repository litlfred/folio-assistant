---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-007-33-online-incremental-streaming-updates
section_title: "Online incremental (streaming) updates"
section_number: 3.3
pages: 3-3
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
After offline training, we fix the explicit embeddings (Z𝑈, ˜Z𝑈)
and re-compute embeddings Z𝑊as follows. Given a new graph
𝐺𝑡𝑘,𝑘> 0, we use the new adjacency matrix 𝐺𝑡in place of 𝐺
to initialize item embeddings via Eq.2 and follow Eq.3 to obtain
the final embedding for 𝑤, again plugging in 𝐺𝑡𝑘for 𝐺. Finally,
we obtain new recommendation scores via Eq.1 on missing edges
between users and items.
4
