---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-045
section_title: "Page 45"
pages: 45-45
pdf_page: 45
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
45
Table 7.1
Computational times for a partial SVD. The time, in seconds, required to compute the ℓ
leading components in the SVD of an n × n matrix using each of the methods from §7.4. The last
row indicates the time needed to obtain a full SVD.
n = 1024
n = 2048
n = 4096
ℓ
direct
gauss
srft
direct
gauss
srft
direct
gauss
srft
10
1.08e-1
5.63e-2
9.06e-2
4.22e-1
2.16e-1
3.56e-1
1.70e 0
8.94e-1
1.45e 0
20
1.97e-1
9.69e-2
1.03e-1
7.67e-1
3.69e-1
3.89e-1
3.07e 0
1.44e 0
1.53e 0
40
3.91e-1
1.84e-1
1.27e-1
1.50e 0
6.69e-1
4.33e-1
6.03e 0
2.64e 0
1.63e 0
80
7.84e-1
4.00e-1
2.19e-1
3.04e 0
1.43e 0
6.64e-1
1.20e 1
5.43e 0
2.08e 0
160
1.70e 0
9.92e-1
6.92e-1
6.36e 0
3.36e 0
1.61e 0
2.46e 1
1.16e 1
3.94e 0
320
3.89e 0
2.65e 0
2.98e 0
1.34e 1
7.45e 0
5.87e 0
5.00e 1
2.41e 1
1.21e 1
640
1.03e 1
8.75e 0
1.81e 1
3.14e 1
2.13e 1
2.99e 1
1.06e 2
5.80e 1
5.35e 1
1280
—
—
—
7.97e 1
6.69e 1
3.13e 2
2.40e 2
1.68e 2
4.03e 2
svd
1.19e 1
8.77e 1
6.90e 2
dom matrix for this example. (ii) The standard SRFT and the modiﬁed SRFT have
essentially identical errors. (iii) There is almost no diﬀerence between the Gaussian
random matrix and the random orthonormal matrix in the ﬁrst three plots, while the
fourth plot shows that the random orthonormal matrix performs better. This behav-
ior occurs because, with high probability, a tall Gaussian matrix is well conditioned
and a (nearly) square Gaussian matrix is not.
Remark 7.1. The running times reported in Table 7.1 and in Figure 7.7 depend
strongly on both the computer hardware and the coding of the algorithms. The ex-
periments reported here were performed on a standard oﬃce desktop with a 3.2 GHz
Pentium IV processor and 2 GB of RAM. The algorithms were implemented in For-
tran 90 and compiled with the Lahey compiler. The Lahey versions of BLAS and
LAPACK were used to accelerate all matrix–matrix multiplications, as well as the
SVD computations in Algorithms 5.1 and 5.2. We used the code for the modiﬁed
SRFT (4.8) provided in the publicly available software package id dist [90].
Part III: Theory
This part of the paper, §§8–11, provides a detailed analysis of randomized sam-
pling schemes for constructing an approximate basis for the range of a matrix, the task
we refer to as Stage A in the framework of §1.2. More precisely, we assess the qual-
ity of the basis Q that the proto-algorithm of §1.3 produces by establishing rigorous
bounds for the approximation error
|||A −QQ∗A||| ,
(7.2)
where |||·||| denotes either the spectral norm or the Frobenius norm. The diﬃculty in
developing these bounds is that the matrix Q is random, and its distribution is a
complicated nonlinear function of the input matrix A and the random test matrix Ω.
Naturally, any estimate for the approximation error must depend on the properties
of the input matrix and the distribution of the test matrix.
To address these challenges, we split the argument into two pieces. The ﬁrst part
exploits techniques from linear algebra to deliver a generic error bound that depends
on the interaction between the test matrix Ωand the right singular vectors of the
input matrix A, as well as the tail singular values of A. In the second part of the
argument, we take into account the distribution of the random matrix to estimate
the error for speciﬁc instantiations of the proto-algorithm. This bipartite proof is
