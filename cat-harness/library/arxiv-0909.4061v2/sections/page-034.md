---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-034
section_title: "Page 34"
pages: 34-34
pdf_page: 34
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
34
HALKO, MARTINSSON, AND TROPP
For motivation, we begin with the case where A is Hermitian. Let us recall the
proto-algorithm from §1.3.3: Draw a random test matrix Ω; form the sample matrix
Y = AΩ; then construct a basis Q for the range of Y . It turns out that the matrices
Ω, Y , and Q contain all the information we need to approximate A.
To see why, deﬁne the (currently unknown) matrix B via B = Q∗AQ. Postmul-
tiplying the deﬁnition by Q∗Ω, we obtain the identity BQ∗Ω= Q∗AQQ∗Ω. The
relationships AQQ∗≈A and AΩ= Y show that B must satisfy
BQ∗Ω≈Q∗Y .
(5.13)
All three matrices Ω, Y , and Q are available, so we can solve (5.13) to obtain the
matrix B. Then the low-rank factorization A ≈QBQ∗can be converted to an eigen-
value decomposition via familiar techniques. The entire procedure requires O(k2n)
ﬂops, and it is summarized as Algorithm 5.6.
Algorithm 5.6: Eigenvalue Decomposition in One Pass
Given an Hermitian matrix A, a random test matrix Ω, a sample matrix Y =
AΩ, and an orthonormal matrix Q that veriﬁes (5.1) and Y = QQ∗Y , this
algorithm computes an approximate eigenvalue decomposition A ≈UΛU∗.
1
Use a standard least-squares solver to ﬁnd an Hermitian matrix Bapprox
that approximately satisﬁes the equation Bapprox(Q∗Ω) ≈Q∗Y .
2
Compute the eigenvalue decomposition Bapprox = V ΛV ∗.
3
Form the product U = QV .
When A is not Hermitian, it is still possible to devise single-pass algorithms, but
we must modify the initial Stage A of the approximation framework to simultaneously
construct bases for the ranges of A and A∗:
1. Generate random matrices Ωand eΩ.
2. Compute Y = AΩand eY = A∗eΩin a single pass over A.
3. Compute QR factorizations Y = QR and eY = e
Q e
R.
This procedure results in matrices Q and e
Q such that A ≈QQ∗A e
Q e
Q∗. The reduced
matrix we must approximate is B = Q∗A e
Q. In analogy with (5.13), we ﬁnd that
Q∗Y = Q∗AΩ≈Q∗A e
Q e
Q∗Ω= B e
Q∗Ω.
(5.14)
An analogous calculation shows that B should also satisfy
e
Q∗eY ≈B∗Q∗eΩ.
(5.15)
Now, the reduced matrix Bapprox can be determined by ﬁnding a minimum-residual
solution to the system of relations (5.14) and (5.15).
Remark 5.4. The single-pass approaches described in this section can degrade
the approximation error in the ﬁnal decomposition signiﬁcantly. To explain the issue,
we focus on the Hermitian case.
It turns out that the coeﬃcient matrix Q∗Ωin
the linear system (5.13) is usually ill-conditioned. In a worst-case scenario, the error
∥A −UΛU∗∥in the factorization produced by Algorithm 5.6 could be larger than
