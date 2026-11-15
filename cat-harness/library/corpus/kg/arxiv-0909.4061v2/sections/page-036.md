---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-036
section_title: "Page 36"
pages: 36-36
pdf_page: 36
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
36
HALKO, MARTINSSON, AND TROPP
6.2. Matrices for which matrix–vector products can be rapidly evalu-
ated. In many problems in data mining and scientiﬁc computing, the cost Tmult of
performing the matrix–vector multiplication x 7→Ax is substantially smaller than
the nominal cost O(mn) for the dense case. It is not uncommon that O(m + n) ﬂops
suﬃce. Standard examples include (i) very sparse matrices; (ii) structured matrices,
such as T¨oplitz operators, that can be applied using the FFT or other means; and
(iii) matrices that arise from physical problems, such as discretized integral operators,
that can be applied via, e.g., the fast multipole method [66].
Suppose that both A and A∗admit fast multiplies. The appropriate randomized
approach for this scenario completes Stage A using Algorithm 4.1 with p constant (for
the ﬁxed-rank problem) or Algorithm 4.2 (for the ﬁxed-precision problem) at a cost
of (k + p) Tmult + O(k2m) ﬂops. For Stage B, we invoke Algorithm 5.1, which requires
(k + p) Tmult + O(k2(m + n)) ﬂops. The total cost Tsparse satisﬁes
Tsparse = 2 (k + p) Tmult + O(k2(m + n)).
(6.2)
As a rule of thumb, the approximation error of this procedure satisﬁes
∥A −UΣV ∗∥≲
√
kn · σk+1.
(6.3)
The estimate (6.3) follows from Corollary 10.9 and the discussion in §5.1. Actual
errors are usually smaller.
When the singular spectrum of A decays slowly, we can incorporate q iterations
of the power method (Algorithm 4.3) to obtain superior solutions to the ﬁxed-rank
problem. The computational cost increases to, cf. (6.2),
Tsparse = (2q + 2) (k + p) Tmult + O(k2(m + n)),
(6.4)
while the error (6.3) improves to
∥A −UΣV ∗∥≲(kn)1/2(2q+1) · σk+1.
(6.5)
The estimate (6.5) takes into account the discussion in §10.4. The power scheme can
also be adapted for the ﬁxed-precision problem (§4.5).
In this setting, the classical prescription for obtaining a partial SVD is some vari-
ation of a Krylov-subspace method; see §3.3.4. These methods exhibit great diversity,
so it is hard to specify a “typical” computational cost. To a ﬁrst approximation, it is
fair to say that in order to obtain an approximate SVD of rank k, the cost of a numer-
ically stable implementation of a Krylov method is no less than the cost (6.2) with p
set to zero. At this price, the Krylov method often obtains better accuracy than the
basic randomized method obtained by combining Algorithms 4.1 and 5.1, especially
for matrices whose singular values decay slowly. On the other hand, the randomized
schemes are inherently more robust and allow much more freedom in organizing the
computation to suit a particular application or a particular hardware architecture.
The latter point is in practice of crucial importance because it is usually much faster
to apply a matrix to k vectors simultaneously than it is to execute k matrix–vector
multiplications consecutively. In practice, blocking and parallelism can lead to enough
gain that a few steps of the power method (Algorithm 4.3) can be performed more
quickly than k steps of a Krylov method.
Remark 6.2. Any comparison between randomized sampling schemes and Krylov
variants becomes complicated because of the fact that “basic” Krylov schemes such
