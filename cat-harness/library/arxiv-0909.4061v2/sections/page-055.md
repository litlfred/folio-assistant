---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-055
section_title: "Page 55"
pages: 55-55
pdf_page: 55
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
55
because b
A(k) is a best rank-k approximation to the matrix PZA, whereas PZA(k) is
an undistinguished rank-k matrix. It follows that
PZA −b
A(k)
 ≤
PZ(A −A(k))
 ≤
A −A(k)
 = σk+1.
(9.13)
The second inequality holds because the orthogonal projector is a contraction; the
last identity follows from Mirsky’s theorem [97]. Combine (9.12) and (9.13) to reach
the main result.
Remark 9.1. In the randomized setting, the truncation step appears to be less
damaging than the error bound of Theorem 9.3 suggests, but we currently lack a
complete theoretical understanding of its behavior.
10. Gaussian test matrices. The error bound in Theorem 9.1 shows that
the performance of the proto-algorithm depends on the interaction between the test
matrix Ωand the right singular vectors of the input matrix A. Algorithm 4.1 is a
particularly simple version of the proto-algorithm that draws the test matrix according
to the standard Gaussian distribution. The literature contains a wealth of information
about these matrices, which allows us to perform a very precise error analysis.
We focus on the real case in this section. Analogous results hold in the complex
case, where the algorithm even exhibits superior performance.
10.1. Technical background. A standard Gaussian matrix is a random ma-
trix whose entries are independent standard normal variables. The distribution of
a standard Gaussian matrix is rotationally invariant: If U and V are orthonormal
matrices, then U∗GV also has the standard Gaussian distribution.
Our analysis requires detailed information about the properties of Gaussian ma-
trices. In particular, we must understand how the norm of a Gaussian matrix and its
pseudoinverse vary. We summarize the relevant results and citations here, reserving
the details for Appendix A.
Proposition 10.1 (Expected norm of a scaled Gaussian matrix). Fix matrices
S, T , and draw a standard Gaussian matrix G. Then

E ∥SGT ∥2
F
1/2
= ∥S∥F ∥T ∥F
and
(10.1)
E ∥SGT∥≤∥S∥∥T ∥F + ∥S∥F ∥T ∥.
(10.2)
The identity (10.1) follows from a direct calculation. The second bound (10.2)
relies on methods developed by Gordon [62, 63]. See Propositions A.1 and A.2.
Proposition 10.2 (Expected norm of a pseudo-inverted Gaussian matrix). Draw
a k × (k + p) standard Gaussian matrix G with k ≥2 and p ≥2. Then

E
G†2
F
1/2
=
s
k
p −1
and
(10.3)
E
G† ≤e√k + p
p
.
(10.4)
