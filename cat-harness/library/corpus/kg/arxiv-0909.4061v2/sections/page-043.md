---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-043
section_title: "Page 43"
pages: 43-43
pdf_page: 43
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
43
along these principal directions. To identify the subject in a new picture, we compute
its decomposition in this basis and use a classiﬁcation technique, such as nearest
neighbors, to select the closest image in the database [122].
We construct a data matrix A as follows: The FERET database contains 7254
images, and each 384×256 image contains 98 304 pixels. First, we build a 98 304×7254
matrix e
A whose columns are the images. We form A by centering each column of
e
A and scaling it to unit norm, so that the images are roughly comparable.
The
eigenfaces are the dominant left singular vectors of this matrix.
Our goal then is to compute an approximate SVD of the matrix A. Represented
as an array of double-precision real numbers, A would require 5.4 GB of storage, which
does not ﬁt within the fast memory of many machines. It is possible to compress the
database down to at 57 MB or less (in JPEG format), but then the data would have
to be uncompressed with each sweep over the matrix. Furthermore, the matrix A has
slowly decaying singular values, so we need to use the power scheme, Algorithm 4.3,
to capture the range of the matrix accurately.
To address these concerns, we implemented the power scheme to run in a pass-
eﬃcient manner. An additional diﬃculty arises because the size of the data makes
it expensive to calculate the actual error eℓincurred by the approximation or to
determine the minimal error σℓ+1.
To estimate the errors, we use the technique
described in Remark 4.1.
Figure 7.6 describes the behavior of the power scheme, which is similar to its
performance for the graph Laplacian in §7.2. When the exponent q = 0, the ap-
proximation of the data matrix is very poor, but it improves quickly as q increases.
Likewise, the estimate for the spectrum of A appears to converge rapidly; the largest
singular values are already quite accurate when q = 1. We see essentially no improve-
ment in the estimates after the ﬁrst 3–5 passes over the matrix.
7.4. Performance of structured random matrices. Our ﬁnal set of experi-
ments illustrates that the structured random matrices described in §4.6 lead to matrix
approximation algorithms that are both fast and accurate.
First, we compare the computational speeds of four methods for computing an
approximation to the ℓdominant terms in the SVD of an n × n matrix A. For now,
we are interested in execution time only (not accuracy), so the choice of matrix is
irrelevant and we have selected A to be a Gaussian matrix. The four methods are
summarized in the following table; Remark 7.1 provides more details on the imple-
mentation.
Method
Stage A
Stage B
direct
Rank-revealing QR executed using column
Algorithm 5.1
pivoting and Householder reﬂectors
gauss
Algorithm 4.1 with a Gaussian random matrix
Algorithm 5.1
srft
Algorithm 4.1 with the modiﬁed SRFT (4.8)
Algorithm 5.2
svd
Full SVD with LAPACK routine dgesdd
Truncate to ℓterms
Table 7.1 lists the measured runtime of a single execution of each algorithm for
various choices of the dimension n of the input matrix and the rank ℓof the ap-
proximation. Of course, the cost of the full SVD does not depend on the number ℓ
of components required. A more informative way to look at the runtime data is to
compare the relative cost of the algorithms. The direct method is the best determin-
