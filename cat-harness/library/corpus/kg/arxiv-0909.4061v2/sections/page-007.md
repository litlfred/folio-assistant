---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-007
section_title: "Page 7"
pages: 7-7
pdf_page: 7
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
7
that we can reorganize this matrix multiplication for maximum eﬃciency in a variety
of computational architectures.
1.4.1. A general dense matrix that ﬁts in fast memory. A standard deter-
ministic technique for computing an approximate SVD is to perform a rank-revealing
QR factorization of the matrix, and then to manipulate the factors to obtain the ﬁnal
decomposition. The cost of this approach is typically O(kmn) ﬂoating-point opera-
tions, or ﬂops, although these methods require slightly longer running times in rare
cases [68].
In contrast, randomized schemes can produce an approximate SVD using only
O(mn log(k) + (m + n)k2) ﬂops. The gain in asymptotic complexity is achieved by
using a random matrix Ωthat has some internal structure, which allows us to evaluate
the product AΩrapidly. For example, randomizing and subsampling the discrete
Fourier transform works well. Sections 4.6 and 11 contain more information on this
approach.
1.4.2. A matrix for which matrix–vector products can be evaluated
rapidly. When the matrix A is sparse or structured, we may be able to apply it
rapidly to a vector. In this case, the classical prescription for computing a partial SVD
is to invoke a Krylov subspace method, such as the Lanczos or Arnoldi algorithm.
It is diﬃcult to summarize the computational cost of these methods because their
performance depends heavily on properties of the input matrix and on the amount of
eﬀort spent to stabilize the algorithm. (Inherently, the Lanczos and Arnoldi methods
are numerically unstable.) For the same reasons, the error analysis of such schemes
is unsatisfactory in many important environments.
At the risk of being overly simplistic, we claim that the typical cost of a Krylov
method for approximating the k leading singular vectors of the input matrix is pro-
portional to k Tmult + (m + n)k2, where Tmult denotes the cost of a matrix–vector
multiplication with the input matrix and the constant of proportionality is small. We
can also apply randomized methods using a Gaussian test matrix Ωto complete the
factorization at the same cost, O(k Tmult + (m + n)k2) ﬂops.
With a given budget of ﬂoating-point operations, Krylov methods sometimes
deliver a more accurate approximation than randomized algorithms. Nevertheless, the
methods described in this survey have at least two powerful advantages over Krylov
methods. First, the randomized schemes are inherently stable, and they come with
very strong performance guarantees that do not depend on subtle spectral properties
of the input matrix. Second, the matrix–vector multiplies required to form AΩcan be
performed in parallel. This fact allows us to restructure the calculations to take full
advantage of the computational platform, which can lead to dramatic accelerations
in practice, especially for parallel and distributed machines.
A more detailed comparison or randomized schemes and Krylov subspace methods
is given in §6.2.
1.4.3. A general dense matrix stored in slow memory or streamed.
When the input matrix is too large to ﬁt in core memory, the cost of transferring the
matrix from slow memory typically dominates the cost of performing the arithmetic.
The standard techniques for low-rank approximation described in §1.4.1 require O(k)
passes over the matrix, which can be prohibitively expensive.
In contrast, the proto-algorithm of §1.3.3 requires only one pass over the data to
produce the approximate basis Q for Stage A of the approximation framework. This
straightforward approach, unfortunately, is not accurate enough for matrices whose
