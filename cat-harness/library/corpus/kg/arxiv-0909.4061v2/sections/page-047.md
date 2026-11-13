---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-047
section_title: "Page 47"
pages: 47-47
pdf_page: 47
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
47
0
0.5
1
1.5
x 10
−4
0
2
4
6
8
10
x 10
4
0
0.5
1
1.5
2
x 10
−8
0
2
4
6
8
10
12
x 10
8
0
0.5
1
1.5
x 10
−12
0
2
4
6
8
10
12
x 10
12
2
4
6
x 10
−15
0
0.5
1
1.5
2
x 10
16
Empirical density
e25
e50
e75
e100
ℓ= 25
ℓ= 75
ℓ= 50
ℓ= 100
Gauss
Ortho
SRFT
GSRFT
Fig. 7.8. Empirical probability density functions for the error in Algorithm 4.1. As described
in §7.4, the algorithm is implemented with four distributions for the random test matrix and used
to approximate the 200 × 200 input matrix obtained by discretizing the integral operator (7.1). The
four panels capture the empirical error distribution for each version of the algorithm at the moment
when ℓ= 25, 50, 75, 100 random samples have been drawn.
Alternatively, we can deﬁne a psd (resp., pd) matrix as an Hermitian matrix with
nonnegative (resp., positive) eigenvalues. In particular, each psd matrix is diagonal-
izable, and the inverse of a pd matrix is also pd. The spectral norm of a psd matrix
M has the variational characterization
∥M∥= max
u̸=0
u∗Mu
u∗u ,
(8.1)
according to the Rayleigh–Ritz theorem [72, Thm. 4.2.2]. It follows that
M ≼N
=⇒
∥M∥≤∥N∥.
(8.2)
A fundamental fact is that conjugation preserves the psd property.
Proposition 8.1 (Conjugation Rule). Suppose that M ≽0. For every A, the
matrix A∗MA ≽0. In particular,
M ≼N
=⇒
A∗MA ≼A∗NA.
Our argument invokes the conjugation rule repeatedly. As a ﬁrst application, we
establish a perturbation bound for the matrix inverse near the identity matrix.
