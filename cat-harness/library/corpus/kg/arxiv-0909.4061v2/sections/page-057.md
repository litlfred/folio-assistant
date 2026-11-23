---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-057
section_title: "Page 57"
pages: 57-57
pdf_page: 57
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
57
This theorem predicts several intriguing behaviors of Algorithm 4.1. The Eckart–
Young theorem [54] shows that (P
j>k σ2
j )1/2 is the minimal Frobenius-norm error
when approximating A with a rank-k matrix. This quantity is the appropriate bench-
mark for the performance of the algorithm. If the small singular values of A are very
ﬂat, the series may be as large as σk+1
p
min{m, n} −k. On the other hand, when
the singular values exhibit some decay, the error may be on the same order as σk+1.
The error bound always exceeds this baseline error, but it may be polynomially
larger, depending on the ratio between the target rank k and the oversampling pa-
rameter p. For p small (say, less than ﬁve), the error is somewhat variable because
the small singular values of a nearly square Gaussian matrix are very unstable. As
the oversampling increases, the performance improves quickly. When p ∼k, the error
is already within a constant factor of the baseline.
The error bound for the spectral norm is somewhat more complicated, but it
reveals some interesting new features.
Theorem 10.6 (Average spectral error). Under the hypotheses of Theorem 10.5,
E ∥(I −PY )A∥≤
 
1 +
s
k
p −1
!
σk+1 + e√k + p
p
X
j>k σ2
j
1/2
.
Mirsky [97] has shown that the quantity σk+1 is the minimum spectral-norm error
when approximating A with a rank-k matrix, so the ﬁrst term in Theorem 10.6 is
analogous with the error bound in Theorem 10.5. The second term represents a new
phenomenon: we also pay for the Frobenius-norm error in approximating A. Note
that, as the amount p of oversampling increases, the polynomial factor in the second
term declines much more quickly than the factor in the ﬁrst term. When p ∼k, the
factor on the σk+1 term is constant, while the factor on the series has order k−1/2
We also note that the bound in Theorem 10.6 implies
E ∥(I −PY )A∥≤
"
1 +
s
k
p −1 + e√k + p
p
·
p
min{m, n} −k
#
σk+1,
so the average spectral-norm error always lies within a small polynomial factor of the
baseline σk+1.
Let us continue with the proofs of these results.
Proof. [Theorem 10.5] Let V be the right unitary factor of A. Partition V =
[V1 | V2] into blocks containing, respectively, k and n −k columns. Recall that
Ω1 = V ∗
1 Ω
and
Ω2 = V ∗
2 Ω.
The Gaussian distribution is rotationally invariant, so V ∗Ωis also a standard Gaus-
sian matrix. Observe that Ω1 and Ω2 are nonoverlapping submatrices of V ∗Ω, so
these two matrices are not only standard Gaussian but also stochastically indepen-
dent. Furthermore, the rows of a (fat) Gaussian matrix are almost surely in general
position, so the k × (k + p) matrix Ω1 has full row rank with probability one.
H¨older’s inequality and Theorem 9.1 together imply that
E ∥(I −PY )A∥F ≤

E ∥(I −PY )A∥2
F
1/2
≤
Σ2
2
F + E
Σ2Ω2Ω†
1
2
F
1/2
.
