---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-021
section_title: "Page 21"
pages: 21-21
pdf_page: 21
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
21
Converting B and C into a partial ID is a one-step process:
1. Compute J and X such that B = B(: ,J)X.
Then A ≈A(: ,J)X, but the approximation error may deteriorate from the initial
estimate. For example, if we compute the ID using the Gu–Eisenstat algorithm [68]
with the parameter f = 2, then the error
A −A(: ,J)X
 ≤(1+
p
1 + 4k(n −k))·ε.
Compare this bound with Lemma 5.1 below.
3.3.4. Krylov-subspace methods. Suppose that the matrix A can be applied
rapidly to vectors, as happens when A is sparse or structured. Then Krylov subspace
techniques can very eﬀectively and accurately compute partial spectral decomposi-
tions. For concreteness, assume that A is Hermitian. The idea of these techniques is
to ﬁx a starting vector ω and to seek approximations to the eigenvectors within the
corresponding Krylov subspace
Vq(ω) = span {ω, Aω, A2ω, . . . , Aq−1ω}.
Krylov methods also come in blocked versions, in which the starting vector ω is
replaced by a starting matrix Ω. A common recommendation is to draw a starting
vector ω (or starting matrix Ω) from a standardized Gaussian distribution, which
indicates a signiﬁcant overlap between Krylov methods and the methods in this paper.
The most basic versions of Krylov methods for computing spectral decompositions
are numerically unstable. High-quality implementations require that we incorporate
restarting strategies, techniques for maintaining high-quality bases for the Krylov
subspaces, etc. The diversity and complexity of such methods make it hard to state
a precise computational cost, but in the environment we consider in this paper, a
typical cost for a fully stable implementation would be
TKrylov ∼k Tmult + k2(m + n),
(3.3)
where Tmult is the cost of a matrix–vector multiplication.
Part II: Algorithms
This part of the paper, §§4–7, provides detailed descriptions of randomized algo-
rithms for constructing low-rank approximations to matrices. As discussed in §1.2,
we split the problem into two stages. In Stage A, we construct a subspace that cap-
tures the action of the input matrix. In Stage B, we use this subspace to obtain an
approximate factorization of the matrix.
Section 4 develops randomized methods for completing Stage A, and §5 describes
deterministic methods for Stage B. Section 6 compares the computational costs of the
resulting two-stage algorithm with the classical approaches outlined in §3. Finally, §7
illustrates the performance of the randomized schemes via numerical examples.
4. Stage A: Randomized schemes for approximating the range. This
section outlines techniques for constructing a subspace that captures most of the
action of a matrix. We begin with a recapitulation of the proto-algorithm that we
introduced in §1.3. We discuss how it can be implemented in practice (§4.1) and then
consider the question of how many random samples to acquire (§4.2). Afterward, we
