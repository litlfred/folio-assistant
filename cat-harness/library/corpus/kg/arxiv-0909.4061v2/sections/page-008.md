---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-008
section_title: "Page 8"
pages: 8-8
pdf_page: 8
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
8
HALKO, MARTINSSON, AND TROPP
singular spectrum decays slowly, but we can address this problem using very few (say,
2 to 4) additional passes over the data [112]. See §1.6 or §4.5 for more discussion.
Typically, Stage B uses one additional pass over the matrix to construct the ap-
proximate SVD. With slight modiﬁcations, however, the two-stage randomized scheme
can be revised so that it only makes a single pass over the data. Refer to §5.5 for
information.
1.5. Performance analysis. A principal goal of this paper is to provide a de-
tailed analysis of the performance of the proto-algorithm described in §1.3.3. This
investigation produces precise error bounds, expressed in terms of the singular values
of the input matrix. Furthermore, we determine how several choices of the random
matrix Ωimpact the behavior of the algorithm.
Let us oﬀer a taste of this theory. The following theorem describes the average-
case behavior of the proto-algorithm with a Gaussian test matrix, assuming we per-
form the computation in exact arithmetic. This result is a simpliﬁed version of The-
orem 10.6.
Theorem 1.1.
Suppose that A is a real m × n matrix. Select a target rank
k ≥2 and an oversampling parameter p ≥2, where k + p ≤min{m, n}. Execute the
proto-algorithm with a standard Gaussian test matrix to obtain an m× (k + p) matrix
Q with orthonormal columns. Then
E ∥A −QQ∗A∥≤

1 + 4√k + p
p −1
·
p
min{m, n}

σk+1,
(1.8)
where E denotes expectation with respect to the random test matrix and σk+1 is the
(k + 1)th singular value of A.
We recall that the term σk+1 appearing in (1.8) is the smallest possible error (1.4)
achievable with any basis matrix Q. The theorem asserts that, on average, the al-
gorithm produces a basis whose error lies within a small polynomial factor of the
theoretical minimum. Moreover, the error bound (1.8) in the randomized algorithm
is slightly sharper than comparable bounds for deterministic techniques based on
rank-revealing QR algorithms [68].
The reader might be worried about whether the expectation provides a useful
account of the approximation error. Fear not: the actual outcome of the algorithm
is almost always very close to the typical outcome because of measure concentration
eﬀects. As we discuss in §10.3, the probability that the error satisﬁes
∥A −QQ∗A∥≤
h
1 + 11
p
k + p ·
p
min{m, n}
i
σk+1
(1.9)
is at least 1 −6 · p−p under very mild assumptions on p. This fact justiﬁes the use of
an oversampling term as small as p = 5. This simpliﬁed estimate is very similar to
the major results in [91].
The theory developed in this paper provides much more detailed information
about the performance of the proto-algorithm.
• When the singular values of A decay slightly, the error ∥A −QQ∗A∥does
not depend on the dimensions of the matrix (§§10.2–10.3).
• We can reduce the size of the bracket in the error bound (1.8) by combining
the proto-algorithm with a power iteration (§10.4). For an example, see §1.6
below.
