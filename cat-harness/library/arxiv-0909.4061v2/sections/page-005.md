---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
5
parameter p, we seek to construct a matrix Q with k + p orthonormal columns such
that
∥A −QQ∗A∥≈
min
rank(X)≤k ∥A −X∥.
(1.5)
Although there exists a minimizer Q that solves the ﬁxed rank problem for p = 0, the
opportunity to use a small number of additional columns provides a ﬂexibility that is
crucial for the eﬀectiveness of the computational methods we discuss.
We will demonstrate that algorithms for the ﬁxed-rank problem can be adapted
to solve the ﬁxed-precision problem. The connection is based on the observation that
we can build the basis matrix Q incrementally and, at any point in the computation,
we can inexpensively estimate the residual error ∥A −QQ∗A∥. Refer to §4.4 for the
details of this reduction.
1.3.2. Intuition. To understand how randomness helps us solve the ﬁxed-rank
problem, it is helpful to consider some motivating examples.
First, suppose that we seek a basis for the range of a matrix A with exact rank
k. Draw a random vector ω, and form the product y = Aω. For now, the precise
distribution of the random vector is unimportant; just think of y as a random sample
from the range of A. Let us repeat this sampling process k times:
y(i) = Aω(i),
i = 1, 2, . . ., k.
(1.6)
Owing to the randomness, the set {ω(i) : i = 1, 2, . . . , k} of random vectors is likely
to be in general linear position. In particular, the random vectors form a linearly
independent set and no linear combination falls in the null space of A. As a result,
the set {y(i) : i = 1, 2, . . . , k} of sample vectors is also linearly independent, so it
spans the range of A. Therefore, to produce an orthonormal basis for the range of A,
we just need to orthonormalize the sample vectors.
Now, imagine that A = B + E where B is a rank-k matrix containing the
information we seek and E is a small perturbation. Our priority is to obtain a basis
that covers as much of the range of B as possible, rather than to minimize the number
of basis vectors. Therefore, we ﬁx a small number p, and we generate k + p samples
y(i) = Aω(i) = Bω(i) + Eω(i),
i = 1, 2, . . . , k + p.
(1.7)
The perturbation E shifts the direction of each sample vector outside the range of B,
which can prevent the span of {y(i) : i = 1, 2, . . ., k} from covering the entire range
of B. In contrast, the enriched set {y(i) : i = 1, 2, . . . , k + p} of samples has a much
better chance of spanning the required subspace.
Just how many extra samples do we need?
Remarkably, for certain types of
random sampling schemes, the failure probability decreases superexponentially with
the oversampling parameter p; see (1.9). As a practical matter, setting p = 5 or p = 10
often gives superb results. This observation is one of the principal facts supporting
the randomized approach to numerical linear algebra.
1.3.3. A prototype algorithm. The intuitive approach of §1.3.2 can be ap-
plied to general matrices. Omitting computational details for now, we formalize the
procedure in the ﬁgure labeled Proto-Algorithm.
This simple algorithm is by no means new. It is essentially the ﬁrst step of a
subspace iteration with a random initial subspace [61, §7.3.2]. The novelty comes
from the additional observation that the initial subspace should have a slightly higher
