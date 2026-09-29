---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-009-gaussian-processes
section_title: "Gaussian Processes"
section_number: null
pages: 15-15
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
Let 𝑓: X →R be a function. When 𝑋is finite, one can think of 𝑓as a collection of function
values ( 𝑓(𝑥))𝑥∈X computed across evaluation/context points X. The same intuitive image can
be useful to think of 𝑓in the infinite case.
A Gaussian process (GP) can be seen as a probability distribution on a function space
H = { 𝑓: X →R} (Williams and Rasmussen, 2006). The defining property of a GP is that any
finite collection of evaluation points (𝑥𝑖)𝑛
𝑖=1 ⊂X, the probability distribution over ( 𝑓(𝑥𝑖))𝑛
𝑖=1 is
multivariate Gaussian. A GP is fully characterized by its mean function 𝜇: X →R and its
covariance function 𝑘: X × X →R.
The covariance function, expressed through a (positive-definite) kernel 𝑘: X × X →R, with
the property that it is symmetric in its two arguments and
𝑛
∑︁
𝑖=1
𝑛
∑︁
𝑗=1
𝑐𝑖𝑐𝑗𝑘(𝑥𝑖, 𝑥𝑗) ≥0
(4.1)
holds for all (𝑥𝑖∈X)𝑛
𝑖=1, (𝑐𝑖∈R)𝑛
𝑖=1, and 𝑛∈N. The latter can be expressed through linear
algebra: Let (𝑲)𝑖𝑗= 𝑘(𝑥𝑖, 𝑥𝑗) be the matrix with coefficients equal all evaluations of 𝑘under
(𝑥𝑖)𝑛
𝑖=1. Then (4.1) is equivalent to saying that 𝑲is positive semi-definite.
An example of commonly-used covariance functions is the Matèrn kernel with smoothness
parameter 𝜈. This class of kernels induces a GP over the space of functions that is up to 𝑘-times
differentiable for 𝑘< 𝜈. So, with 𝜈= 5/2, the GP is over the space of functions that are
twice differentiable. Another example is the radial basis function (RBF) kernel, also known
as the squared exponential kernel. This can be seen as the limit of the Matérn kernel when
𝜈→∞. It thus induces a GP on 𝐶∞. See standard Gaussian process textbooks, e.g. Williams
and Rasmussen (2006), for definitions.
