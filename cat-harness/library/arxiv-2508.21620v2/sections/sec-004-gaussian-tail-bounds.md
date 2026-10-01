---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-004-gaussian-tail-bounds
section_title: "Gaussian Tail Bounds"
section_number: null
pages: 8-8
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
For Gaussian random variables, we have the following theorem (Srinivas et al., 2010):
Theorem 2.12 (Gaussian Tail Bound). Let 𝑋be a Gaussian r.v. with mean 𝜇and variance
𝜎2. For any 𝛽> 0,
P(|𝑋−𝜇| ≥𝛽𝜎) ≤exp

−𝛽2/2

.
(2.10)
Here is another useful property for Gaussian r.v.s. with nonpositive means:
Theorem 2.13 (Gaussian Tail with Nonpositive Mean). Let 𝑋be a Gaussian r.v. with
mean 𝜇≤0 and variance 𝜎2. Then,
E(𝑋I(𝑋≥0)) =
𝜎
√
2𝜋
exp
−𝜇2
2𝜎2

.
(2.11)
The expression 𝑋I(𝑋≥0) means we are looking at the Gaussian r.v. 𝑋where it takes values
≥0 and ignore everywhere else.
