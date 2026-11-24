---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-006-3-methodology
section_title: "Methodology"
section_number: 3
pages: 5-5
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
Inspired by previous work (section 2.3) and desiderata from user
studies [4, 7, 9, 12, 25, 45], we consider a simple alternative to
sensitivity-driven methods of XAI evaluation: the important fea-
tures in any explanation should be more predictive of the model
output than the unimportant features. AXE adopts classifier ac-
curacy [28] to measure the predictiveness of the top-n important
features. This “top-n” style formulation, just like prior metrics from
table 1, is considered intuitive for practitioners [2].
For datapoint x and explanation e, the top-n most important
features are the importances with the largest absolute values. To
measure explanation quality 𝑞, AXE uses predictiveness – the ac-
curacy of a k-Nearest Neighbors (k-NN) model 𝑀𝑘in recovering
the model prediction 𝑚(x) using only the subset of the the top-n
most important features. The k-NN 𝑀mimics the prediction 𝑚(x)
of model 𝑚by averaging over the predictions from the k neighbors
nearest to x [13, 19]. We motivate our choice of k-NN based on
feature separability in section 3.2.
3.1
