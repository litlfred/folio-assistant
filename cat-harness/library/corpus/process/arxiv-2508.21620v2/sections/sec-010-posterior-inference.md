---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-010-posterior-inference
section_title: "Posterior Inference"
section_number: null
pages: 15-16
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
GPs are useful to make predictions about an unknown function 𝑓. Let D := {(𝑥𝑖, 𝑓(𝑥𝑖))}𝑛
𝑖=1 be
a dataset. Assuming a GP prior1 𝑝( 𝑓) = GP(0, 𝑘) over 𝑓, the GP posterior is described through
the updated mean and covariance functions 𝜇(· | D) : X →R and 𝑘(·, · | D) : X × X →R,
respectively. They are characterized by
𝜇(𝑥| D) = 𝑘(𝑥, 𝑋)

𝑘(𝑋, 𝑋) + 𝜎2
𝑛𝐼
−1
𝑌
(4.2)
1In practical applications, 𝜇is often simply set to the zero function.
14
4 Gaussian Processes
𝑘(𝑥| D) = 𝑘(𝑥, 𝑥) −𝑘(𝑥, 𝑋)

𝑘(𝑋, 𝑋) + 𝜎2
𝑛𝐼
−1
𝑘(𝑋, 𝑥),
(4.3)
where we have defined shorthands 𝑋:= (𝑥𝑖)𝑛
𝑖=1 and 𝑌:= ( 𝑓(𝑥𝑖))𝑛
𝑖=1 ∈R𝑛. Also, 𝑘(𝑥, 𝑋),
𝑘(𝑋, 𝑋), and 𝑘(𝑋, 𝑥) are the matrix representations of the kernel under those evaluation points.
Finally, 𝜎2
𝑛> 0 is a measurement noise assumed in evaluating 𝑓(𝑥), i.e. 𝑦= 𝑓(𝑥) + 𝜀where
𝜀∼N (0, 𝜎2
𝑛).
