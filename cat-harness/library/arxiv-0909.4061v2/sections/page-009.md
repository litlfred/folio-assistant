---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-009
section_title: "Page 9"
pages: 9-9
pdf_page: 9
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
9
Prototype for Randomized SVD
Given an m × n matrix A, a target number k of singular vectors, and an
exponent q (say q = 1 or q = 2), this procedure computes an approximate
rank-2k factorization UΣV ∗, where U and V are orthonormal, and Σ is
nonnegative and diagonal.
Stage A:
1
Generate an n × 2k Gaussian test matrix Ω.
2
Form Y = (AA∗)qAΩby multiplying alternately with A and A∗.
3
Construct a matrix Q whose columns form an orthonormal basis for
the range of Y .
Stage B:
4
Form B = Q∗A.
5
Compute an SVD of the small matrix: B = eUΣV ∗.
6
Set U = Q eU.
Note: The computation of Y in Step 2 is vulnerable to round-oﬀerrors.
When high accuracy is required, we must incorporate an orthonormalization
step between each application of A and A∗; see Algorithm 4.4.
• For the structured random matrices we mentioned in §1.4.1, related error
bounds are in force (§11).
• We can obtain inexpensive a posteriori error estimates to verify the quality
of the approximation (§4.3).
1.6. Example:
Randomized SVD. We conclude this introduction with a
short discussion of how these ideas allow us to perform an approximate SVD of a
large data matrix, which is a compelling application of randomized matrix approxi-
mation [112].
The two-stage randomized method oﬀers a natural approach to SVD compu-
tations. Unfortunately, the simplest version of this scheme is inadequate in many
applications because the singular spectrum of the input matrix may decay slowly. To
address this diﬃculty, we incorporate q steps of a power iteration, where q = 1 or
q = 2 usually suﬃces in practice. The complete scheme appears in the box labeled
Prototype for Randomized SVD. For most applications, it is important to incorporate
additional reﬁnements, as we discuss in §§4–5.
The Randomized SVD procedure requires only 2(q + 1) passes over the matrix,
so it is eﬃcient even for matrices stored out-of-core. The ﬂop count satisﬁes
TrandSVD = (2q + 2) k Tmult + O(k2(m + n)),
where Tmult is the ﬂop count of a matrix–vector multiply with A or A∗. We have the
following theorem on the performance of this method in exact arithmetic, which is a
consequence of Corollary 10.10.
Theorem 1.2. Suppose that A is a real m × n matrix. Select an exponent q
and a target number k of singular vectors, where 2 ≤k ≤0.5 min{m, n}. Execute the
