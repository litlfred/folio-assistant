---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-114-proof-of-lemma-442
section_title: "Proof of Lemma 4.4.2"
section_number: null
pages: 158-158
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Proof. We argue this by applying the proof of Lemma 4.3.3. For a fixed (augmented) in-
stance (i.e., fixed instance and fixed random permutation), we are interested in computing
the number of different behaviors as we vary B, α . To understand this, let us start by
fixing B. Then, by Lemma 4.3.3, we know that there are at most kT possible behaviors
as we vary α . Now, for a fixed value of B, for either algorithm, the sequence of pulls is
determined, which exactly determines the loss in Stage 1. Thus, each value of B corre-
sponds to at most 1 new value of the loss. This implies that there are at most kT possible
behaviors in both stages for a fixed value of B. Since there are at most T values of B, we
have that there are at most kT 2 possible behaviors.
B.5.5
