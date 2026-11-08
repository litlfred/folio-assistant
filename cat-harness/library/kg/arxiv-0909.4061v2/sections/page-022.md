---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-022
section_title: "Page 22"
pages: 22-22
pdf_page: 22
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
22
HALKO, MARTINSSON, AND TROPP
Algorithm 4.1: Randomized Range Finder
Given an m × n matrix A, and an integer ℓ, this scheme computes an m × ℓ
orthonormal matrix Q whose range approximates the range of A.
1
Draw an n × ℓGaussian random matrix Ω.
2
Form the m × ℓmatrix Y = AΩ.
3
Construct an m × ℓmatrix Q whose columns form an orthonormal
basis for the range of Y , e.g., using the QR factorization Y = QR.
present several ways in which the basic scheme can be improved. Sections 4.3 and 4.4
explain how to address the situation where the numerical rank of the input matrix is
not known in advance. Section 4.5 shows how to modify the scheme to improve its
accuracy when the singular spectrum of the input matrix decays slowly. Finally, §4.6
describes how the scheme can be accelerated by using a structured random matrix.
4.1. The proto-algorithm revisited. The most natural way to implement
the proto-algorithm from §1.3 is to draw a random test matrix Ωfrom the standard
Gaussian distribution. That is, each entry of Ωis an independent Gaussian random
variable with mean zero and variance one. For reference, we formulate the resulting
scheme as Algorithm 4.1.
The number Tbasic of ﬂops required by Algorithm 4.1 satisﬁes
Tbasic ∼ℓn Trand + ℓTmult + ℓ2m
(4.1)
where Trand is the cost of generating a Gaussian random number and Tmult is the cost
of multiplying A by a vector. The three terms in (4.1) correspond directly with the
three steps of Algorithm 4.1.
Empirically, we have found that the performance of Algorithm 4.1 depends very
little on the quality of the random number generator used in Step 1.
The actual cost of Step 2 depends substantially on the matrix A and the com-
putational environment that we are working in.
The estimate (4.1) suggests that
Algorithm 4.1 is especially eﬃcient when the matrix–vector product x 7→Ax can be
evaluated rapidly. In particular, the scheme is appropriate for approximating sparse
or structured matrices. Turn to §6 for more details.
The most important implementation issue arises when performing the basis cal-
culation in Step 3. Typically, the columns of the sample matrix Y are almost linearly
dependent, so it is imperative to use stable methods for performing the orthonor-
malization. We have found that the Gram–Schmidt procedure, augmented with the
double orthogonalization described in [12], is both convenient and reliable. Methods
based on Householder reﬂectors or Givens rotations also work very well. Note that
very little is gained by pivoting because the columns of the random matrix Y are
independent samples drawn from the same distribution.
4.2. The number of samples required. The goal of Algorithm 4.1 is to pro-
duce an orthonormal matrix Q with few columns that achieves
∥(I −QQ∗)A∥≤ε,
(4.2)
where ε is a speciﬁed tolerance. The number of columns ℓthat the algorithm needs to
reach this threshold is usually slightly larger than the minimal rank k of the smallest
