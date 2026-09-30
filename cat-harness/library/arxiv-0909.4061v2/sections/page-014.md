---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-014
section_title: "Page 14"
pages: 14-14
pdf_page: 14
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
14
HALKO, MARTINSSON, AND TROPP
Tensor skeletons. Randomized column selection methods can be used to produce
CUR-type decompositions of higher-order tensors [49].
Matrix multiplication. Column selection and dimension reduction techniques can
be used to accelerate the multiplication of rank-deﬁcient matrices [45, 118].
See also [10].
Overdetermined linear systems. The randomized Kaczmarz algorithm is a lin-
early convergent iterative method that can be used to solve overdetermined
linear systems [101,128].
Overdetermined least squares. Fast dimension-reduction maps can sometimes ac-
celerate the solution of overdetermined least-squares problems [52, 118].
Nonnegative least squares. Fast dimension reduction maps can be used to reduce
the size of nonnegative least-squares problems [16].
Preconditioned least squares. Randomized matrix approximations can be used
to precondition conjugate gradient to solve least-squares problems [113].
Other regression problems. Randomized algorithms for ℓ1 regression are described
in [28]. Regression in ℓp for p ∈[1, ∞) has also been considered [31].
Facility location. The Fermat–Weber facility location problem can be viewed as
matrix approximation with respect to a diﬀerent discrepancy measure. Ran-
domized algorithms for this type of problem appear in [121].
2.1.6. Compressive sampling. Although randomized matrix approximation
and compressive sampling are based on some common intuitions, it is facile to con-
sider either one as a subspecies of the other. We oﬀer a short overview of the ﬁeld
of compressive sampling—especially the part connected with matrices—so we can
highlight some of the diﬀerences.
The theory of compressive sampling starts with the observation that many types
of vector-space data are compressible. That is, the data are approximated well using
a short linear combination of basis functions drawn from a ﬁxed collection [42]. For
example, natural images are well approximated in a wavelet basis; numerically low-
rank matrices are well approximated as a sum of rank-one matrices. The idea behind
compressive sampling is that suitably chosen random samples from this type of com-
pressible object carry a large amount of information. Furthermore, it is possible to
reconstruct the compressible object from a small set of these random samples, often
by solving a convex optimization problem. The initial discovery works of Cand`es–
Romberg–Tao [20] and Donoho [41] were written in 2004.
The earliest work in compressive sampling focused on vector-valued data; soon
after, researchers began to study compressive sampling for matrices. In 2007, Recht–
Fazel–Parillo demonstrated that it is possible to reconstruct a rank-deﬁcient matrix
from Gaussian measurements [111]. More recently, Cand`es–Recht [22] and Cand`es–
Tao [23] considered the problem of completing a low-rank matrix from a random
sample of its entries.
The usual goals of compressive sampling are (i) to design a method for collecting
informative, nonadaptive data about a compressible object and (ii) to reconstruct a
compressible object given some measured data. In both cases, there is an implicit
assumption that we have limited—if any—access to the underlying data.
In the problem of matrix approximation, we typically have a complete representa-
tion of the matrix at our disposal. The point is to compute a simpler representation as
eﬃciently as possible under some operational constraints. In particular, we would like
to perform as little computation as we can, but we are usually allowed to revisit the
input matrix. Because of the diﬀerent focus, randomized matrix approximation algo-
