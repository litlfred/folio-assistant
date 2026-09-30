---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-010
section_title: "Page 10"
pages: 10-10
pdf_page: 10
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
10
HALKO, MARTINSSON, AND TROPP
Randomized SVD algorithm to obtain a rank-2k factorization UΣV ∗. Then
E ∥A −UΣV ∗∥≤
"
1 + 4
r
2 min{m, n}
k −1
#1/(2q+1)
σk+1,
(1.10)
where E denotes expectation with respect to the random test matrix and σk+1 is the
(k + 1)th singular value of A.
This result is new. Observe that the bracket in (1.10) is essentially the same as
the bracket in the basic error bound (1.8). We ﬁnd that the power iteration drives
the leading constant to one exponentially fast as the power q increases. The rank-k
approximation of A can never achieve an error smaller than σk+1, so the randomized
procedure computes 2k approximate singular vectors that capture as much of the
matrix as the ﬁrst k actual singular vectors.
In practice, we can truncate the approximate SVD, retaining only the ﬁrst k
singular values and vectors. Equivalently, we replace the diagonal factor Σ by the
matrix Σ(k) formed by zeroing out all but the largest k entries of Σ. For this truncated
SVD, we have the error bound
E
A −UΣ(k)V ∗ ≤σk+1 +
"
1 + 4
r
2 min{m, n}
k −1
#1/(2q+1)
σk+1.
(1.11)
In words, we pay no more than an additive term σk+1 when we perform the truncation
step. Our numerical experience suggests that the error bound (1.11) is pessimistic.
See Remark 5.1 and §9.4 for some discussion of truncation.
1.7. Outline of paper. The paper is organized into three parts: an introduction
(§§1–3), a description of the algorithms (§§4–7), and a theoretical performance analysis
(§§8–11). The two latter parts commence with a short internal outline. Each part is
more or less self-contained, and after a brief review of our notation in §§3.1–3.2, the
reader can proceed to either the algorithms or the theory part.
2. Related work and historical context. Randomness has occasionally sur-
faced in the numerical linear algebra literature; in particular, it is quite standard to
initialize iterative algorithms for constructing invariant subspaces with a randomly
chosen point. Nevertheless, we believe that sophisticated ideas from random matrix
theory have not been incorporated into classical matrix factorization algorithms un-
til very recently. We can trace this development to earlier work in computer science
and—especially—to probabilistic methods in geometric analysis. This section presents
an overview of the relevant work. We begin with a survey of randomized methods for
matrix approximation; then we attempt to trace some of the ideas backward to their
sources.
2.1. Randomized matrix approximation. Matrices of low numerical rank
contain little information relative to their apparent dimension owing to the linear de-
pendency in their columns (or rows). As a result, it is reasonable to expect that these
matrices can be approximated with far fewer degrees of freedom. A less obvious fact
is that randomized schemes can be used to produce these approximations eﬃciently.
Several types of approximation techniques build on this idea. These methods all
follow the same basic pattern:
