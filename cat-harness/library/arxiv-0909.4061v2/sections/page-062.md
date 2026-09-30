---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-062
section_title: "Page 62"
pages: 62-62
pdf_page: 62
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
62
HALKO, MARTINSSON, AND TROPP
Theorem 11.1 (The SRFT preserves geometry).
Fix an n × k orthonormal
matrix V , and draw an n × ℓSRFT matrix Ωwhere the parameter ℓsatisﬁes
4
h√
k +
p
8 log(kn)
i2
log(k) ≤ℓ≤n.
Then
0.40 ≤σk(V ∗Ω)
and
σ1(V ∗Ω) ≤1.48
with failure probability at most O(k−1).
In words, the kernel of an SRFT of dimension ℓ∼k log(k) is unlikely to intersect
a ﬁxed k-dimensional subspace. In contrast with the Gaussian case, the logarithmic
factor log(k) in the lower bound on ℓcannot generally be removed (Remark 11.2).
Theorem 11.1 follows from a straightforward variation of the argument in [134],
which establishes equivalent bounds for a real analog of the SRFT, called the subsam-
pled randomized Hadamard transform (SRHT). We omit further details.
Remark 11.1. For large problems, we can obtain better numerical constants [134,
Thm. 3.2]. Fix a small, positive number ι. If k ≫log(n), then sampling
ℓ≥(1 + ι) · k log(k)
coordinates is suﬃcient to ensure that σk(V ∗Ω) ≥ι with failure probability at most
O(k−cι). This sampling bound is essentially optimal because (1 −ι) · k log(k) samples
are not adequate in the worst case; see Remark 11.2.
Remark 11.2. The logarithmic factor in Theorem 11.1 is necessary when the
orthonormal matrix V is particularly evil. Let us describe an inﬁnite family of worst-
case examples. Fix an integer k, and let n = k2. Form an n × k orthonormal matrix
V by regular decimation of the n × n identity matrix.
More precisely, V is the
matrix whose jth row has a unit entry in column (j −1)/k when j ≡1 (mod k) and
is zero otherwise. To see why this type of matrix is nasty, it is helpful to consider
the auxiliary matrix W = V ∗DF . Observe that, up to scaling and modulation of
columns, W consists of k copies of a k × k DFT concatenated horizontally.
Suppose that we apply the SRFT Ω= DF R∗to the matrix V ∗. We obtain a
matrix of the form X = V ∗Ω= W R∗, which consists of ℓrandom columns sampled
from W .
Theorem 11.1 certainly cannot hold unless σk(X) > 0.
To ensure the
latter event occurs, we must pick at least one copy each of the k distinct columns
of W . This is the coupon collector’s problem [98, Sec. 3.6] in disguise. To obtain
a complete set of k coupons (i.e., columns) with nonnegligible probability, we must
draw at least k log(k) columns. The fact that we are sampling without replacement
does not improve the analysis appreciably because the matrix has too many columns.
11.2. Performance guarantees. We are now prepared to present detailed in-
formation on the performance of the proto-algorithm when the test matrix Ωis an
SRFT.
Theorem 11.2 (Error bounds for SRFT). Fix an m × n matrix A with singular
values σ1 ≥σ2 ≥σ3 ≥. . . . Draw an n × ℓSRFT matrix Ω, where
4
h√
k +
p
8 log(kn)
i2
log(k) ≤ℓ≤n.
