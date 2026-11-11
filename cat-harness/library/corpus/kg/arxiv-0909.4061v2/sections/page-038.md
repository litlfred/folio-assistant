---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-038
section_title: "Page 38"
pages: 38-38
pdf_page: 38
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
38
HALKO, MARTINSSON, AND TROPP
crucial to enhance the accuracy of the randomized approach using the power scheme,
Algorithm 4.3, or some other device. This approach increases the pass count some-
what, but in our experience it is very rare that more than ﬁve passes are required.
6.4. Gains from parallelization. As mentioned in §§6.2–6.3, randomized meth-
ods often outperform classical techniques not because they involve fewer ﬂoating-point
operations but rather because they allow us to reorganize the calculations to exploit
the matrix properties and the computer architecture more fully. In addition, these
methods are well suited for parallel implementation. For example, in Algorithm 4.1,
the computational bottleneck is the evaluation of the matrix product AΩ, which is
embarrassingly parallelizable.
7. Numerical examples. By this time, the reader has surely formulated a
pointed question: Do these randomized matrix approximation algorithms actually
work in practice? In this section, we attempt to address this concern by illustrating
how the algorithms perform on a diverse collection of test cases.
Section 7.1 starts with two examples from the physical sciences involving discrete
approximations to operators with exponentially decaying spectra. Sections 7.2 and
7.3 continue with two examples of matrices arising in “data mining.”
These are
large matrices whose singular spectra decay slowly; one is sparse and ﬁts in RAM,
one is dense and is stored out-of-core. Finally, §7.4 investigates the performance of
randomized methods based on structured random matrices.
Sections 7.1–7.3 focus on the algorithms for Stage A that we presented in §4
because we wish to isolate the performance of the randomized step.
Computational examples illustrating truly large data matrices have been reported
elsewhere, for instance in [69].
7.1. Two matrices with rapidly decaying singular values. We ﬁrst illus-
trate the behavior of the adaptive range approximation method, Algorithm 4.2. We
apply it to two matrices associated with the numerical analysis of diﬀerential and
integral operators. The matrices in question have rapidly decaying singular values
and our intent is to demonstrate that in this environment, the approximation error
of a bare-bones randomized method such as Algorithm 4.2 is very close to the mini-
mal error achievable by any method. We observe that the approximation error of a
randomized method is itself a random variable (it is a function of the random matrix
Ω) so what we need to demonstrate is not only that the error is small in a typical
realization, but also that it clusters tightly around the mean value.
We ﬁrst consider a 200×200 matrix A that results from discretizing the following
single-layer operator associated with the Laplace equation:
[Sσ](x) = const ·
Z
Γ1
log |x −y| σ(y) dA(y),
x ∈Γ2,
(7.1)
where Γ1 and Γ2 are the two contours in R2 illustrated in Figure 7.1(a). We ap-
proximate the integral with the trapezoidal rule, which converges superalgebraically
because the kernel is smooth. In the absence of ﬂoating-point errors, we estimate that
the discretization error would be less than 10−20 for a smooth source σ. The leading
constant is selected so the matrix A has unit operator norm.
We implement Algorithm 4.2 in Matlab v6.5. Gaussian test matrices are generated
using the randn command. For each number ℓof samples, we compare the following
three quantities:
