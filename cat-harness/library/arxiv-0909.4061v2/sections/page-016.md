---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-016
section_title: "Page 16"
pages: 16-16
pdf_page: 16
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
16
HALKO, MARTINSSON, AND TROPP
One of the original examples is the use of random models for arithmetical errors,
which was pioneered by von Neumann and Goldstine. Their papers [135,136] stand
among the ﬁrst works to study the properties of random matrices. The earliest nu-
merical linear algebra algorithm that depends essentially on randomized techniques
is probably Dixon’s method for estimating norms and condition numbers [39].
Another situation where randomness commonly arises is the initialization of iter-
ative methods for computing invariant subspaces. For example, most numerical linear
algebra texts advocate random selection of the starting vector for the power method
because it ensures that the vector has a nonzero component in the direction of a dom-
inant eigenvector. Wo´zniakowski and coauthors have analyzed the performance of the
power method and the Lanczos iteration given a random starting vector [79, 85].
Among other interesting applications of randomness, we mention the work by
Parker and Pierce, which applies a randomized FFT to eliminate pivoting in Gaus-
sian elimination [106], work by Demmel et al. who have studied randomization in
connection with the stability of fast methods for linear algebra [35], and work by Le
and Parker utilizing randomized methods for stabilizing fast linear algebraic compu-
tations based on recursive algorithms, such as Strassen’s matrix multiplication [81].
2.2.4. Scientiﬁc computing. One of the ﬁrst algorithmic applications of ran-
domness is the method of Monte Carlo integration introduced by Von Neumann and
Ulam [95], and its extensions, such as the Metropolis algorithm for simulations in sta-
tistical physics. (See [9] for an introduction.) The most basic technique is to estimate
an integral by sampling m points from the measure and computing an empirical mean
of the integrand evaluated at the sample locations:
Z
f(x) dµ(x) ≈1
m
m
X
i=1
f(Xi),
where Xi are independent and identically distributed according to the probability
measure µ. The law of large numbers (usually) ensures that this approach produces
the correct result in the limit as m →∞. Unfortunately, the approximation error
typically has a standard deviation of m−1/2, and the method provides no certiﬁcate
of success.
The disappointing computational proﬁle of Monte Carlo integration seems to
have inspired a distaste for randomized approaches within the scientiﬁc computing
community. Fortunately, there are many other types of randomized algorithms—such
as the ones in this paper—that do not suﬀer from the same shortcomings.
2.2.5. Geometric functional analysis. There is one more character that plays
a central role in our story: the probabilistic method in geometric analysis. Many of
the algorithms and proof techniques ultimately come from work in this beautiful but
recondite corner of mathematics.
Dvoretsky’s theorem [53] states (roughly) that every inﬁnite-dimensional Banach
space contains an n-dimensional subspace whose geometry is essentially the same as
an n-dimensional Hilbert space, where n is an arbitrary natural number. In 1971,
V. D. Milman developed a striking proof of this result by showing that a random
n-dimensional subspace of an N-dimensional Banach space has this property with
exceedingly high probability, provided that N is large enough [96]. Milman’s article
debuted the concentration of measure phenomenon, which is a geometric interpreta-
tion of the classical idea that regular functions of independent random variables rarely
