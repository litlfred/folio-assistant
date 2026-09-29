---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-044
section_title: "Page 44"
pages: 44-44
pdf_page: 44
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
44
HALKO, MARTINSSON, AND TROPP
0
20
40
60
80
100
10
0
10
1
10
2
 
 
0
20
40
60
80
100
10
0
10
1
10
2
Approximation error eℓ
Estimated Singular Values σj
Magnitude
Minimal error (est)
q = 0
q = 1
q = 2
q = 3
ℓ
j
Fig. 7.6.
Computing eigenfaces.
For varying exponent q, one trial of the power scheme,
Algorithm 4.3, applied to the 98 304×7254 matrix A described in §7.3. (Left) Approximation errors
as a function of the number ℓof random samples.
The red line indicates the minimal errors as
estimated by the singular values computed using ℓ= 100 and q = 3. (Right) Estimates for the 100
largest eigenvalues given ℓ= 100 random samples.
istic approach for dense matrices, so we calculate the factor by which the randomized
methods improve on this benchmark. Figure 7.7 displays the results. We make two
observations: (i) Using an SRFT often leads to a dramatic speed-up over classical
techniques, even for moderate problem sizes. (ii) Using a standard Gaussian test ma-
trix typically leads to a moderate speed-up over classical methods, primarily because
performing a matrix–matrix multiplication is faster than a QR factorization.
Second, we investigate how the choice of random test matrix inﬂuences the error
in approximating an input matrix. For these experiments, we return to the 200 × 200
matrix A deﬁned in Section 7.1. Consider variations of Algorithm 4.1 obtained when
the random test matrix Ωis drawn from the following four distributions:
Gauss:
The standard Gaussian distribution.
Ortho:
The uniform distribution on n × ℓorthonormal matrices.
SRFT:
The SRFT distribution deﬁned in (4.6).
GSRFT:
The modiﬁed SRFT distribution deﬁned in (4.8).
Intuitively, we expect that Ortho should provide the best performance.
For each distribution, we perform 100 000 trials of the following experiment. Ap-
ply the corresponding version of Algorithm 4.1 to the matrix A, and calculate the
approximation error eℓ= ∥A −QℓQ∗
ℓA∥. Figure 7.8 displays the empirical proba-
bility density function for the error eℓobtained with each algorithm. We oﬀer three
observations: (i) The SRFT actually performs slightly better than a Gaussian ran-
