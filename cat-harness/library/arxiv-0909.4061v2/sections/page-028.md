---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-028
section_title: "Page 28"
pages: 28-28
pdf_page: 28
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
28
HALKO, MARTINSSON, AND TROPP
Algorithm 4.5: Fast Randomized Range Finder
Given an m × n matrix A, and an integer ℓ, this scheme computes an m × ℓ
orthonormal matrix Q whose range approximates the range of A.
1
Draw an n × ℓSRFT test matrix Ω, as deﬁned by (4.6).
2
Form the m × ℓmatrix Y = AΩusing a (subsampled) FFT.
3
Construct an m × ℓmatrix Q whose columns form an orthonormal
basis for the range of Y , e.g., using the QR factorization Y = QR.
At this point, it is not well understood how to quantify and compare the behav-
ior of structured random transforms. One reason for this uncertainty is that it has
been diﬃcult to analyze the amount of oversampling that various transforms require.
Section 11 establishes that the random matrix (4.6) can be used to identify a near-
optimal basis for a rank-k matrix using ℓ∼(k + log(n)) log(k) samples. In practice,
the transforms (4.6) and (4.8) typically require no more oversampling than a Gaussian
test matrix requires. (For a numerical example, see §7.4.) As a consequence, setting
ℓ= k + 10 or ℓ= k + 20 is typically more than adequate. Further research on these
questions would be valuable.
Remark 4.4. The structured random matrices discussed in this section do not
adapt readily to the ﬁxed-precision problem, where the computational tolerance is
speciﬁed, because the samples from the range are usually computed in bulk. Fortu-
nately, these schemes are suﬃciently inexpensive that we can progressively increase
the number of samples computed starting with ℓ= 32, say, and then proceeding to
ℓ= 64, 128, 256, . . . until we achieve the desired tolerance.
Remark 4.5. When using the SRFT (4.6) for matrix approximation, we have
a choice whether to use a subsampled FFT or a full FFT. The complete FFT is so
inexpensive that it often pays to construct an extended sample matrix Ylarge = ADF
and then generate the actual samples by drawing columns at random from Ylarge and
rescaling as needed. The asymptotic cost increases to O(mn log(n)) ﬂops, but the full
FFT is actually faster for moderate problem sizes because the constant suppressed by
the big-O notation is so small. Adaptive rank determination is easy because we just
examine extra samples as needed.
Remark 4.6. Among the structured random matrices that we have tried, one of
the strongest candidates involves sequences of random Givens rotations [113]. This
matrix takes the form
Ω= D′′ Θ′ D′ Θ D F R,
(4.8)
where the prime symbol ′ indicates an independent realization of a random matrix.
The matrices R, F , and D are deﬁned after (4.6). The matrix Θ is a chain of random
Givens rotations:
Θ = Π G(1, 2; θ1) G(2, 3; θ2) · · · G(n −1, n; θn−1)
where Π is a random n × n permutation matrix; where θ1, . . . , θn−1 are independent
random variables uniformly distributed on the interval [0, 2π]; and where G(i, j; θ)
denotes a rotation on Cn by the angle θ in the (i, j) coordinate plane [61, §5.1.8].
