---
doc_id: arxiv-2202.02427v1
doc_title: "Lightweight Compositional Embeddings for Incremental Streaming Recommendation"
section_id: sec-002-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-2
source_pdf: arxiv-2202.02427v1.pdf
source_sha256: f55daf70e8b4d5ac
toc_source: outline
---
Real-world recommender systems face a number of important
challenges in practice. First, they need to be able to model the rich-
ness of user-item and user-user interactions. Graph-based recom-
mender systems are an excellent fit for this as they frame recommen-
dation as a link prediction task on the user-item graph [10, 32, 36].
Another substantial challenge is the dynamic nature of the inter-
action data that recommendations are based on. For example, on
most content platforms, users continuously interact with items (e.g.,
subscribe to a channel, visit a location) and with each other (e.g.,
exchange messages, co-edit a document).
Despite the fact that graph-based data often arrives in a stream-
ing fashion, much of the work on graph-based recommendation
has focused on static settings, where all information about the test
nodes (users/items) is assumed to be available for model training
and assumed to be constant throughout. This assumptions limits a
models ability to perform well cold-start settings and also bares high
computational costs in practice since models need to be retrained
regularly. In this paper we take a step towards a more realistic
recommendation setting and focus on the task of top-k recommen-
dation under streaming data. In top-k recommendation the goal
is to recommend items that match users’ long-term interests and
will be consumed at some point in the future. This is different from
sequential (often also called session-based or dynamic) recommen-
dation where the task is to predict the next item(s) that a user is
going to consume [12, 13, 20, 22, 30, 34].
More specifically, in this paper, we formalize the problem of
graph-based recommendation in an incremental streaming setting
and we propose a partially compositional model to make future
recommendations efficiently. We assume that one node type (users
or items) is more amenable to “static” representation than the other
(e.g. items). This could mean that the activity changes more slowly
so that less frequent updating is needed, or the size of the node
set is small enough to relearn representations regularly. Then our
model will learn a static representation for one node type (e.g,
items) and learn an implicit, compositional function to calculate the
representation of the other nodes (e.g, users).
Our approach, which we call Lightweight Compositional Embed-
dings (LCE) allows us to: (i) Efficiently update recommendations
over time without having to regularly relearn the model, (ii) Effi-
ciently represent embeddings with fewer parameters compared to
fully-explicit models, (iii) Make partially inductive recommenda-
tions (i.e., for new users or items depending on the choice above).
While there are other approaches that employ compositional func-
tions, most of them are transductive and thus are unable to support
incremental updates [14, 25]. Table 5 in Appendix (Sec. A.1) com-
pares LCE with related methods in more detail.
For empirical evaluation, we employ an incremental replay pro-
tocol to effectively assess the performance of recommendation
systems in real-world streaming settings. Our empirical results
show that LCE, with partially-implicit representations, is able to
effectively utilize incremental information to substantially improve
performance, with a more compact model compared to alternatives.
We also evaluate LCE performance when considering cold-start
items and show significant improvement over the two baselines
that are able to make predictions for unseen items. Finally, we inves-
tigate LCE performance in a production recommendation setting
in Microsoft Teams and show improved performance over Light-
GCN. We further include ablation experiments to show that LCE is
able to (i) more effectively utilize incremental information, and (ii)
approach skyline performance more quickly than alternatives.
In summary, our contributions include:
• Formalization of the setting of graph-based recommendation
under incremental streaming
• Development of a compositional graph-based method (LCE)
that supports efficient incremental updates in a partially
inductive setting
arXiv:2202.02427v1  [cs.LG]  4 Feb 2022
Machine Learning on Graph (MLoG) Workshop at WSDM’22, Feb 25th, 2022, Virtual
Hang and Schnabel, et al.
• Empirical results demonstrating the performance of LCE
achieving significant gains over a set of competitive base-
lines, utilizing an incremental replay evaluation protocol to
capture performance differences in a streaming setting
2
