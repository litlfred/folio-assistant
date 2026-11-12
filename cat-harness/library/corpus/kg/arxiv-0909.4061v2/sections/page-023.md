---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-023
section_title: "Page 23"
pages: 23-23
pdf_page: 23
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
23
basis that veriﬁes (4.2). We refer to this discrepancy p = ℓ−k as the oversampling
parameter. The size of the oversampling parameter depends on several factors:
The matrix dimensions. Very large matrices may require more oversampling.
The singular spectrum. The more rapid the decay of the singular values, the less
oversampling is needed. In the extreme case that the matrix has exact rank
k, it is not necessary to oversample.
The random test matrix. Gaussian matrices succeed with very little oversampling,
but are not always the most cost-eﬀective option. The structured random ma-
trices discussed in §4.6 may require substantial oversampling, but they still
yield computational gains in certain settings.
The theoretical results in Part III provide detailed information about how the
behavior of randomized schemes depends on these factors. For the moment, we limit
ourselves to some general remarks on implementation issues.
For Gaussian test matrices, it is adequate to choose the oversampling parameter
to be a small constant, such as p = 5 or p = 10. There is rarely any advantage to
select p > k. This observation, ﬁrst presented in [91], demonstrates that a Gaussian
test matrix results in a negligible amount of extra computation.
In practice, the target rank k is rarely known in advance. Randomized algorithms
are usually implemented in an adaptive fashion where the number of samples is in-
creased until the error satisﬁes the desired tolerance. In other words, the user never
chooses the oversampling parameter. Theoretical results that bound the amount of
oversampling are valuable primarily as aids for designing algorithms. We develop an
adaptive approach in §§4.3–4.4.
The computational bottleneck in Algorithm 4.1 is usually the formation of the
product AΩ. As a result, it often pays to draw a larger number ℓof samples than
necessary because the user can minimize the cost of the matrix multiplication with
tools such as blocking of operations, high-level linear algebra subroutines, parallel
processors, etc. This approach may lead to an ill-conditioned sample matrix Y , but
the orthogonalization in Step 3 of Algorithm 4.1 can easily identify the numerical
rank of the sample matrix and ignore the excess samples. Furthermore, Stage B of
the matrix approximation process succeeds even when the basis matrix Q has a larger
dimension than necessary.
4.3. A posteriori error estimation. Algorithm 4.1 is designed for solving the
ﬁxed-rank problem, where the target rank of the input matrix is speciﬁed in advance.
To handle the ﬁxed-precision problem, where the parameter is the computational
tolerance, we need a scheme for estimating how well a putative basis matrix Q captures
the action of the matrix A. To do so, we develop a probabilistic error estimator. These
methods are inspired by work of Dixon [39]; our treatment follows [88, 137].
The exact approximation error is ∥(I −QQ∗)A∥. It is intuitively plausible that
we can obtain some information about this quantity by computing ∥(I −QQ∗)Aω∥,
where ω is a standard Gaussian vector. This notion leads to the following method.
Draw a sequence {ω(i) : i = 1, 2, . . . , r} of standard Gaussian vectors, where r is a
small integer that balances computational cost and reliability. Then
∥(I −QQ∗)A∥≤10
r
2
π
max
i=1,...,r
(I −QQ∗)Aω(i)
(4.3)
with probability at least 1−10−r. This statement follows by setting B = (I−QQ∗)A
and α = 10 in the following lemma, whose proof appears in [137, §3.4].
