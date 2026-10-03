---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-029
section_title: "Page 29"
pages: 29-29
pdf_page: 29
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
29
Algorithm 5.1: Direct SVD
Given matrices A and Q such that (5.1) holds, this procedure computes an
approximate factorization A ≈UΣV ∗, where U and V are orthonormal,
and Σ is a nonnegative diagonal matrix.
1
Form the matrix B = Q∗A.
2
Compute an SVD of the small matrix: B = eUΣV ∗.
3
Form the orthonormal matrix U = Q eU.
Remark 4.7.
When the singular values of the input matrix A decay slowly,
Algorithm 4.5 may perform poorly in terms of accuracy. When randomized sampling
is used with a Gaussian random matrix, the recourse is to take a couple of steps of
a power iteration; see Algorithm 4.4. However, it is not currently known whether
such an iterative scheme can be accelerated to O(mn log(k)) complexity using “fast”
random transforms such as the SRFT.
5. Stage B: Construction of standard factorizations. The algorithms for
Stage A described in §4 produce an orthonormal matrix Q whose range captures the
action of an input matrix A:
∥A −QQ∗A∥≤ε,
(5.1)
where ε is a computational tolerance. This section describes methods for approximat-
ing standard factorizations of A using the information in the basis Q.
To accomplish this task, we pursue the idea from §3.3.3 that any low-rank factor-
ization A ≈CB can be manipulated to produce a standard decomposition. When
the bound (5.1) holds, the low-rank factors are simply C = Q and B = Q∗A. The
simplest scheme (§5.1) computes the factor B directly with a matrix–matrix product
to ensure a minimal error in the ﬁnal approximation. An alternative approach (§5.2)
constructs factors B and C without forming any matrix–matrix product. The ap-
proach of §5.2 is often faster than the approach of §5.1 but typically results in larger
errors. Both schemes can be streamlined for an Hermitian input matrix (§5.3) and a
positive semideﬁnite input matrix (§5.4). Finally, we develop single-pass algorithms
that exploit other information generated in Stage A to avoid revisiting the input
matrix (§5.5).
Throughout this section, A denotes an m × n matrix, and Q is an m × k or-
thonormal matrix that veriﬁes (5.1). For purposes of exposition, we concentrate on
methods for constructing the partial SVD.
5.1. Factorizations based on forming Q∗A directly. The relation (5.1) im-
plies that ∥A −QB∥≤ε, where B = Q∗A. Once we have computed B, we can
produce any standard factorization using the methods of §3.3.3. Algorithm 5.1 illus-
trates how to build an approximate SVD.
The factors produced by Algorithm 5.1 satisfy
∥A −UΣV ∗∥≤ε.
(5.2)
In other words, the approximation error does not degrade.
The cost of Algorithm 5.1 is generally dominated by the cost of the product Q∗A
in Step 1, which takes O(kmn) ﬂops for a general dense matrix. Note that this scheme
