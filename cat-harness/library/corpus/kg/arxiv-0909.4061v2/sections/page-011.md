---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-011
section_title: "Page 11"
pages: 11-11
pdf_page: 11
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
11
1. Preprocess the matrix, usually to calculate sampling probabilities.
2. Take random samples from the matrix, where the term sample refers generi-
cally to a linear function of the matrix.
3. Postprocess the samples to compute a ﬁnal approximation, typically with
classical techniques from numerical linear algebra.
This step may require
another look at the matrix.
We continue with a description of the most common approximation schemes.
2.1.1. Sparsiﬁcation. The simplest approach to matrix approximation is the
method of sparsiﬁcation or the related technique of quantization. The goal of sparsiﬁ-
cation is to replace the matrix by a surrogate that contains far fewer nonzero entries.
Quantization produces an approximation whose components are drawn from a (small)
discrete set of values. These methods can be used to limit storage requirements or
to accelerate computations by reducing the cost of matrix–vector and matrix–matrix
multiplies [94, Ch. 6]. The manuscript [33] describes applications in optimization.
Sparsiﬁcation typically involves very simple elementwise calculations. Each entry
in the approximation is drawn independently at random from a distribution deter-
mined from the corresponding entry of the input matrix. The expected value of the
random approximation equals the original matrix, but the distribution is designed so
that a typical realization is much sparser.
The ﬁrst method of this form was devised by Achlioptas and McSherry [2], who
built on earlier work on graph sparsiﬁcation due to Karger [75, 76]. Arora–Hazan–
Kale presented a diﬀerent sampling method in [7]. See [60, 123] for some recent work
on sparsiﬁcation.
2.1.2. Column selection methods. A second approach to matrix approxima-
tion is based on the idea that a small set of columns describes most of the action of
a numerically low-rank matrix. Indeed, classical existential results [117] demonstrate
that every m × n matrix A contains a k-column submatrix C for which
A −CC†A
 ≤
p
1 + k(n −k) ·
A −A(k)
 ,
(2.1)
where k is a parameter, the dagger † denotes the pseudoinverse, and A(k) is a best
rank-k approximation of A. It is NP-hard to perform column selection by optimiz-
ing natural objective functions, such as the condition number of the submatrix [27].
Nevertheless, there are eﬃcient deterministic algorithms, such as the rank-revealing
QR method of [68], that can nearly achieve the error bound (2.1).
There is a class of randomized algorithms that approach the ﬁxed-rank approx-
imation problem (1.5) using this intuition. These methods ﬁrst compute a sampling
probability for each column, either using the squared Euclidean norms of the columns
or their leverage scores. (Leverage scores reﬂect the relative importance of the columns
to the action of the matrix; they can be calculated easily from the dominant k right
singular vectors of the matrix.) Columns are then selected randomly according to this
distribution. Afterward, a postprocessing step is invoked to produce a more reﬁned
approximation of the matrix.
We believe that the earliest method of this form appeared in a 1998 paper of
Frieze–Kannan–Vempala [57, 58].
This work was reﬁned substantially in the pa-
pers [43, 44, 46]. The basic algorithm samples columns from a distribution related
to the squared ℓ2 norms of the columns. This sampling step produces a small column
submatrix whose range is aligned with the range of the input matrix. The ﬁnal ap-
proximation is obtained from a truncated SVD of the submatrix. Given a target rank
