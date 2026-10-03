---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-027
section_title: "Page 27"
pages: 27-27
pdf_page: 27
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
27
Algorithm 4.4: Randomized Subspace Iteration
Given an m × n matrix A and integers ℓand q, this algorithm computes an
m × ℓorthonormal matrix Q whose range approximates the range of A.
1
Draw an n × ℓstandard Gaussian matrix Ω.
2
Form Y0 = AΩand compute its QR factorization Y0 = Q0R0.
3
for j = 1, 2, . . . , q
4
Form eYj = A∗Qj−1 and compute its QR factorization eYj = e
Qj e
Rj.
5
Form Yj = A e
Qj and compute its QR factorization Yj = QjRj.
6
end
7
Q = Qq.
The ﬁrst step toward this accelerated technique is to observe that the bottleneck
in Algorithm 4.1 is the computation of the matrix product AΩ. When the test matrix
Ωis standard Gaussian, the cost of this multiplication is O(mnℓ), the same as a rank-
revealing QR algorithm [68]. The key idea is to use a structured random matrix that
allows us to compute the product in O(mn log(ℓ)) ﬂops.
The subsampled random Fourier transform, or SRFT, is perhaps the simplest
example of a structured random matrix that meets our goals. An SRFT is an n × ℓ
matrix of the form
Ω=
rn
ℓDF R,
(4.6)
where
• D is an n×n diagonal matrix whose entries are independent random variables
uniformly distributed on the complex unit circle,
• F is the n × n unitary discrete Fourier transform (DFT), whose entries take
the values fpq = n−1/2 e−2πi(p−1)(q−1)/n for p, q = 1, 2, . . ., n, and
• R is an n× ℓmatrix that samples ℓcoordinates from n uniformly at random,
i.e., its ℓcolumns are drawn randomly without replacement from the columns
of the n × n identity matrix.
When Ωis deﬁned by (4.6), we can compute the sample matrix Y = AΩus-
ing O(mn log(ℓ)) ﬂops via a subsampled FFT [137]. Then we form the basis Q by
orthonormalizing the columns of Y , as described in §4.1. This scheme appears as
Algorithm 4.5. The total number Tstruct of ﬂops required by this procedure is
Tstruct ∼mn log(ℓ) + ℓ2n
(4.7)
Note that if ℓis substantially larger than the numerical rank k of the input matrix,
we can perform the orthogonalization with O(kℓn) ﬂops because the columns of the
sample matrix are almost linearly dependent.
The test matrix (4.6) is just one choice among many possibilities. Other sugges-
tions that appear in the literature include subsampled Hadamard transforms, chains
of Givens rotations acting on randomly chosen coordinates, and many more. See [86]
and its bibliography. Empirically, we have found that the transform summarized in
Remark 4.6 below performs very well in a variety of environments [113].
