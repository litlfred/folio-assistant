---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-004
section_title: "Page 4"
pages: 4-4
pdf_page: 4
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
4
HALKO, MARTINSSON, AND TROPP
The task in Stage A can be executed very eﬃciently with random sampling meth-
ods, and these methods are the primary subject of this work. In the next subsection,
we oﬀer an overview of these ideas. The body of the paper provides details of the
algorithms (§4) and a theoretical analysis of their performance (§§8–11).
Stage B can be completed with well-established deterministic methods.
Sec-
tion 3.3.3 contains an introduction to these techniques, and §5 shows how we apply
them to produce low-rank factorizations.
At this point in the development, it may not be clear why the output from Stage A
facilitates our job in Stage B. Let us illustrate by describing how to obtain an ap-
proximate SVD of the input matrix A given a matrix Q that satisﬁes (1.2). More
precisely, we wish to compute matrices U and V with orthonormal columns and a
nonnegative, diagonal matrix Σ such that A ≈UΣV ∗. This goal is achieved after
three simple steps:
1. Form B = Q∗A, which yields the low-rank factorization A ≈QB.
2. Compute an SVD of the small matrix: B = eUΣV ∗.
3. Set U = Q eU.
When Q has few columns, this procedure is eﬃcient because we can easily con-
struct the reduced matrix B and rapidly compute its SVD. In practice, we can often
avoid forming B explicitly by means of subtler techniques. In some cases, it is not
even necessary to revisit the input matrix A during Stage B. This observation allows
us to develop single-pass algorithms, which look at each entry of A only once.
Similar manipulations readily yield other standard factorizations, such as the
pivoted QR factorization, the eigenvalue decomposition, etc.
1.3. Randomized algorithms. This paper describes a class of randomized al-
gorithms for completing Stage A of the matrix approximation framework set forth
in §1.2. We begin with some details about the approximation problem these algo-
rithms target (§1.3.1). Afterward, we motivate the random sampling technique with
a heuristic explanation (§1.3.2) that leads to a prototype algorithm (§1.3.3).
1.3.1. Problem formulations. The basic challenge in producing low-rank ma-
trix approximations is a primitive question that we call the ﬁxed-precision approxi-
mation problem. Suppose we are given a matrix A and a positive error tolerance ε.
We seek a matrix Q with k = k(ε) orthonormal columns such that
∥A −QQ∗A∥≤ε,
(1.3)
where ∥·∥denotes the ℓ2 operator norm. The range of Q is a k-dimensional subspace
that captures most of the action of A, and we would like k to be as small as possible.
The singular value decomposition furnishes an optimal answer to the ﬁxed-precision
problem [97]. Let σj denote the jth largest singular value of A. For each j ≥0,
min
rank(X)≤j ∥A −X∥= σj+1.
(1.4)
One way to construct a minimizer is to choose X = QQ∗A, where the columns of Q
are k dominant left singular vectors of A. Consequently, the minimal rank k where
(1.3) holds equals the number of singular values of A that exceed the tolerance ε.
To simplify the development of algorithms, it is convenient to assume that the
desired rank k is speciﬁed in advance. We call the resulting problem the ﬁxed-rank
approximation problem. Given a matrix A, a target rank k, and an oversampling
