---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-020
section_title: "Page 20"
pages: 20-20
pdf_page: 20
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
20
HALKO, MARTINSSON, AND TROPP
columns is less than a computational tolerance ε. Letting ℓdenote the number of steps
required, the process results in a partial factorization
A = QR + E,
(3.2)
where Q is an m×ℓorthonormal matrix, R is a ℓ×n weakly upper-triangular matrix,
and E is a residual that satisﬁes ∥E∥F ≤ε. The computational cost is O(ℓmn),
and the number ℓof steps taken is typically close to the minimal rank k for which
precision ε (in the Frobenius norm) is achievable. The Businger–Golub algorithm can
in principle signiﬁcantly overpredict the rank, but in practice this problem is very
rare provided that orthonormality is maintained scrupulously.
Subsequent research has led to strong rank-revealing QR algorithms that suc-
ceed for all matrices. For example, the Gu–Eisenstat algorithm [68] (setting their
parameter f = 2) produces an QR decomposition of the form (3.2), where
∥E∥≤
p
1 + 4k(n −k) · σk+1.
Recall that σk+1 is the minimal error possible in a rank-k approximation [97]. The
cost of the Gu–Eisenstat algorithm is typically O(kmn), but it can be slightly higher
in rare cases. The algorithm can also be used to obtain an approximate ID [26].
To compute an approximate SVD of a general m×n matrix, the most straightfor-
ward technique is to compute the full SVD and truncate it. This procedure is stable
and accurate, but it requires O(mn min{m, n}) ﬂops. A more eﬃcient approach is to
compute a partial QR factorization and postprocess the factors to obtain a partial
SVD using the methods described below in §3.3.3. This scheme takes only O(kmn)
ﬂops. Krylov subspace methods can also compute partial SVDs at a comparable cost
of O(kmn), but they are less robust.
Note that all the techniques described in this section require extensive random
access to the matrix, and they can be very slow when the matrix is stored out-of-core.
3.3.3. Converting from one partial factorization to another. Suppose
that we have obtained a partial decomposition of a matrix A by some means:
∥A −CB∥≤ε,
where B and C have rank k. Given this information, we can eﬃciently compute any
of the basic factorizations.
We construct a partial QR factorization using the following three steps:
1. Compute a QR factorization of C so that C = Q1R1.
2. Form the product D = R1B, and compute a QR factorization: D = Q2R.
3. Form the product Q = Q1Q2.
The result is an orthonormal matrix Q and a weakly upper-triangular matrix R such
that ∥A −QR∥≤ε.
An analogous technique yields a partial SVD:
1. Compute a QR factorization of C so that C = Q1R1.
2. Form the product D = R1B, and compute an SVD: D = U2ΣV ∗.
3. Form the product U = Q1U2.
The result is a diagonal matrix Σ and orthonormal matrices U and V such that
∥A −UΣV ∗∥≤ε.
