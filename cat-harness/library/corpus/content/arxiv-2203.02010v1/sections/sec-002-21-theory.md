---
doc_id: arxiv-2203.02010v1
doc_title: "This manuscript has been accepted to SPIE Medical Imaging, February 20-24, 2022. Please use the following reference when citing the manuscript"
section_id: sec-002-21-theory
section_title: "Theory"
section_number: 2.1
pages: 3-4
source_pdf: arxiv-2203.02010v1.pdf
source_sha256: ce57446b880d55e4
toc_source: outline
---
2. METHODS
2.1 Theory
Consider a clinical scenario where a total of P patients are being scanned by an imaging system. From the
acquired data of each patient, a set of K QI methods are used to measure certain quantitative values. Such
quantitative values can be the mean activity concentration within diﬀerent organs of interest. Our objective is
to estimate the parameters that can describe the relationship between the true and measured values, without
access to a gold standard. These estimated parameters can then be used to rank the QI methods.
We assume that there exists a linear stochastic relationship between the true and measured values. This
relationship is parameterized by a slope, bias, and Gaussian-distributed noise term. We note that this noise
arises in the process of measuring the same true values but with diﬀerent methods. Thus, the noise is expected
to be correlated. We model this correlated noise by a zero-mean multi-variate Gaussian distribution denoted by
N(0, C). Speciﬁcally, the diagonal elements of C, i.e., {σ2
k}, denote the variance of the noise of each method.
The oﬀ-diagonal elements of C, i.e., {σk,k′}, denote the covariance of the noise between methods k and k′. For
the pth patient, denote the true value by ap and the estimated value using the kth method by ˆap,k. Additionally,
denote the slope and bias of the kth method by uk and vk, respectively. For the pth patient, we can then write
the relationship between the true and measured values as


ˆap,1
ˆap,2
...
ˆap,K

=


u1
v1
u2
v2
...
...
uK
vK


 ap
1

+ N(0, C).
(1)
Denote the vector [ˆap,1, ˆap,2, . . . , ˆap,K]T by ˆ
Ap, the matrix containing {uk} and {vk} by Θ, and the vector
[ap, 1]T by Ap. Based on Eq. (1), obtaining the probability of observing ˆ
Ap given the knowledge of {Ap, Θ, C}
depends on the true values, which are unknown. To address this issue, we next assume that the true values
are sampled from a four-parameter beta distribution (FPBD) parameterized by a vector Ω.20
This FPBD
incorporates the fact that the true values lie within a certain range.
Additionally, the FPBD provides the
capability to model a wide variety of the ranges and shapes of the true distribution.
Let ˆ
A = { ˆ
Ap, p = 1, 2, . . . , P} denote the collection of measurements made by all the K methods from all
the P patients. The NGSE technique uses an ML approach to estimate the values of {Θ, C, Ω} that maximize
the probability of observing ˆ
A. The ML estimate of {Θ, C, Ω} is given by
n
ˆΘ, ˆC, ˆΩ
o
ML = arg max
Θ,C,Ω
n
pr( ˆ
A|Θ, C, Ω)
o
,
(2)
where pr( ˆ
A|Θ, C, Ω) denotes the probability of observing ˆ
A given the knowledge of {Θ, C, Ω}. We note that
obtaining this probability does not require any knowledge of the true values.
The expression for pr( ˆ
A|Θ, C, Ω) was determined to obtain the ML estimates using a constrained optimiza-
tion technique based on the interior-point algorithm.23 From the estimated parameters, we used the slope terms
{ˆuk} and noise standard deviation terms {ˆσk}, i.e., the square root of the diagonal elements of the covariance
matrix, to compute the noise-to-slope ratio (NSR) for each method. For the kth method, the NSR is given by
NSRk = ˆσk
ˆuk
.
(3)
The NSR evaluates QI methods on the basis of precision,15, 16, 20 and a lower value indicates a more precise
estimation performance.
