---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-006
section_title: "Page 6"
pages: 6-6
pdf_page: 6
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
6
HALKO, MARTINSSON, AND TROPP
Proto-Algorithm: Solving the Fixed-Rank Problem
Given an m × n matrix A, a target rank k, and an oversampling parameter
p, this procedure computes an m × (k + p) matrix Q whose columns are
orthonormal and whose range approximates the range of A.
1
Draw a random n × (k + p) test matrix Ω.
2
Form the matrix product Y = AΩ.
3
Construct a matrix Q whose columns form an orthonormal basis for
the range of Y .
dimension than the invariant subspace we are trying to approximate.
With this
revision, it is often the case that no further iteration is required to obtain a high-
quality solution to (1.5). We believe this idea can be traced to [91, 105, 118].
In order to invoke the proto-algorithm with conﬁdence, we must address several
practical and theoretical issues:
• What random matrix Ωshould we use? How much oversampling do we need?
• The matrix Y is likely to be ill-conditioned. How do we orthonormalize its
columns to form the matrix Q?
• What are the computational costs?
• How can we solve the ﬁxed-precision problem (1.3) when the numerical rank
of the matrix is not known in advance?
• How can we use the basis Q to compute other matrix factorizations?
• Does the randomized method work for problems of practical interest? How
does its speed/accuracy/robustness compare with standard techniques?
• What error bounds can we expect? With what probability?
The next few sections provide a summary of the answers to these questions.
We
describe several problem regimes where the proto-algorithm can be implemented ef-
ﬁciently, and we present a theorem that describes the performance of the most im-
portant instantiation. Finally, we elaborate on how these ideas can be applied to
approximate the truncated SVD of a large data matrix. The rest of the paper con-
tains a more exhaustive treatment—including pseudocode, numerical experiments,
and a detailed theory.
1.4. A comparison between randomized and traditional techniques. To
select an appropriate computational method for ﬁnding a low-rank approximation to
a matrix, the practitioner must take into account the properties of the matrix. Is
it dense or sparse? Does it ﬁt in fast memory or is it stored out of core? Does the
singular spectrum decay quickly or slowly? The behavior of a numerical linear algebra
algorithm may depend on all these factors [13, 61, 132]. To facilitate a comparison be-
tween classical and randomized techniques, we summarize their relative performance
in each of three representative environments.
Section 6 contains a more in-depth
treatment.
We focus on the task of computing an approximate SVD of an m × n matrix A
with numerical rank k. For randomized schemes, Stage A generally dominates the
cost of Stage B in our matrix approximation framework (§1.2). Within Stage A, the
computational bottleneck is usually the matrix–matrix product AΩin Step 2 of the
proto-algorithm (§1.3.3). The power of randomized algorithms stems from the fact
