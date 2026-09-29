---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-051
section_title: "Page 51"
pages: 51-51
pdf_page: 51
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
51
Theorem 9.1 (Deterministic error bound).
Let A be an m × n matrix with
singular value decomposition A = UΣV ∗, and ﬁx k ≥0. Choose a test matrix Ω,
and construct the sample matrix Y = AΩ. Partition Σ as speciﬁed in (9.1), and
deﬁne Ω1 and Ω2 via (9.2). Assuming that Ω1 has full row rank, the approximation
error satisﬁes
|||(I −PY )A|||2 ≤|||Σ2|||2 +
Σ2Ω2Ω†
1
2,
(9.3)
where |||·||| denotes either the spectral norm or the Frobenius norm.
Theorem 9.1 sharpens the result [17, Lem. 2], which lacks the squares present
in (9.3). This reﬁnement yields slightly better error estimates than the earlier bound,
and it has consequences for the probabilistic behavior of the error when the test
matrix Ωis random. The proof here is diﬀerent in spirit from the earlier analysis; our
argument is inspired by the perturbation theory of orthogonal projectors [125].
Proof. We establish the bound for the spectral-norm error. The bound for the
Frobenius-norm error follows from an analogous argument that is slightly easier.
Let us begin with some preliminary simpliﬁcations. First, we argue that the left
unitary factor U plays no essential role in the argument. In eﬀect, we execute the
proof for an auxiliary input matrix e
A and an associated sample matrix eY deﬁned by
e
A = U∗A =

Σ1V ∗
1
Σ2V ∗
2

and
eY = e
AΩ=

Σ1Ω1
Σ2Ω2

.
(9.4)
Owing to the unitary invariance of the spectral norm and to Proposition 8.4, we have
the identity
∥(I −PY )A∥=
U∗(I −PY )U e
A
 =
(I −PU ∗Y ) e
A
 =
(I −P e
Y ) e
A
.
(9.5)
In view of (9.5), it suﬃces to prove that
(I −P e
Y ) e
A
 ≤
Σ2
2 +
Σ2Ω2Ω†
1
2.
(9.6)
Second, we assume that the number k is chosen so the diagonal entries of Σ1 are
strictly positive. Suppose not. Then Σ2 is zero because of the ordering of the singular
values. As a consequence,
range( e
A) = range

Σ1V ∗
1
0

= range

Σ1Ω1
0

= range( eY ).
This calculation uses the decompositions presented in (9.4), as well as the fact that
both V ∗
1 and Ω1 have full row rank. We conclude that
(I −P e
Y ) e
A
 = 0,
so the error bound (9.6) holds trivially. (In fact, both sides are zero.)
The main argument is based on ideas from perturbation theory. To illustrate the
concept, we start with a matrix related to eY :
ℓ
W =
 Σ1Ω1
0

k
n −k
