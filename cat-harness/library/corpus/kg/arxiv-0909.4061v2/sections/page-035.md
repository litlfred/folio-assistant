---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-035
section_title: "Page 35"
pages: 35-35
pdf_page: 35
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
35
the error resulting from the two-pass method of Section 5.3 by a factor of 1/τmin,
where τmin is the minimal singular value of the matrix Q∗Ω.
The situation can be improved by oversampling. Suppose that we seek a rank-k
approximate eigenvalue decomposition. Pick a small oversampling parameter p. Draw
an n×(k+p) random matrix Ω, and form the sample matrix Y = AΩ. Let Q denote
the n × k matrix formed by the k leading left singular vectors of Y . Now, the linear
system (5.13) has a coeﬃcient matrix Q∗Ωof size k ×(k +p), so it is overdetermined.
An approximate solution of this system yields a k × k matrix B.
6. Computational costs. So far, we have postponed a detailed discussion of
the computational cost of randomized matrix approximation algorithms because it is
necessary to account for both the ﬁrst stage, where we compute an approximate basis
for the range (§4), and the second stage, where we postprocess the basis to complete
the factorization (§5). We are now prepared to compare the cost of the two-stage
scheme with the cost of traditional techniques.
Choosing an appropriate algorithm, whether classical or randomized, requires us
to consider the properties of the input matrix. To draw a nuanced picture, we discuss
three representative computational environments in §6.1–6.3. We close with some
comments on parallel implementations in §6.4.
For concreteness, we focus on the problem of computing an approximate SVD of
an m × n matrix A with numerical rank k. The costs for other factorizations are
similar.
6.1. General matrices that ﬁt in core memory. Suppose that A is a general
matrix presented as an array of numbers that ﬁts in core memory. In this case, the
appropriate method for Stage A is to use a structured random matrix (§4.6), which
allows us to ﬁnd a basis that captures the action of the matrix using O(mn log(k) +
k2m) ﬂops. For Stage B, we apply the row-extraction technique (§5.2), which costs
an additional O(k2(m + n)) ﬂops. The total number of operations Trandom for this
approach satisﬁes
Trandom ∼mn log(k) + k2(m + n).
As a rule of thumb, the approximation error of this procedure satisﬁes
∥A −UΣV ∗∥≲n · σk+1,
(6.1)
where σk+1 is the (k + 1)th singular value of A. The estimate (6.1), which follows
from Theorem 11.2 and Lemma 5.1, reﬂects the worst-case scenario; actual errors are
usually smaller.
This algorithm should be compared with modern deterministic techniques, such
as rank-revealing QR followed by postprocessing (§3.3.2) which typically require
TRRQR ∼kmn
operations to achieve a comparable error.
In this setting, the randomized algorithm can be several times faster than classical
techniques even for problems of moderate size, say m, n ∼103 and k ∼102. See §7.4
for numerical evidence.
Remark 6.1.
In case row extraction is impractical, there is an alternative
O(mn log(k)) technique described in [137, §5.2]. When the error (6.1) is unacceptably
large, we can use the direct method (§5.1) for Stage B, which brings the total cost to
O(kmn) ﬂops.
