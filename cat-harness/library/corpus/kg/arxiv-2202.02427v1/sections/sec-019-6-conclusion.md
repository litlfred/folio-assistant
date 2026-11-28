---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-019-6-conclusion
section_title: "Conclusion"
section_number: 6
pages: 7-8
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
Motivated by needs of real-world recommender systems, we
consider recommendation in an incremental streaming setting in
this work, where new data continuously comes in after the model
is trained. This is in contrast to the static setting that most graph-
based recommendation systems adopt where all information about
test nodes are available at training time. We propose a composi-
tional graph-based method (LCE) that supports continuous updates
in a streaming setting under low computational cost. To evaluate
the proposed method, we conduct experiments on three real-world
Machine Learning on Graph (MLoG) Workshop at WSDM’22, Feb 25th, 2022, Virtual
Hang and Schnabel, et al.
datasets and demonstrate the superior performance of LCE com-
pared to a set of competitive baselines. In particular, the experi-
mental results show that LCE is able to more effectively utilize
streaming data, in many cases approaching skyline performance
as if it had been relearned with all available data. Moreover, LCE
significantly improves over the other baselines when considering
cold-start items. We also found positive results for LCE when apply-
ing it in a production recommendation setting in Microsoft Teams.
