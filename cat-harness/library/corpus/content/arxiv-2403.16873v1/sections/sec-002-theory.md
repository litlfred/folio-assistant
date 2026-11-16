---
doc_id: arxiv-2403.16873v1
doc_title: "How accurately can quantitative imaging methods be ranked without ground truth: An upper bound on no-gold-standard evaluation"
section_id: sec-002-theory
section_title: "Theory"
section_number: null
pages: 2-3
source_pdf: arxiv-2403.16873v1.pdf
source_sha256: c7e3e51b48a2ed8d
toc_source: outline
---
2. METHODS
2.1 Theory
Consider a set of K QI methods that are used to measure certain quantitative values from a patient population
consisting of P patients. Denote the true quantitative value for pth patient as ap and the corresponding mea-
surement given by kth QI method as ˆap,k. Existing NGSE techniques assume a linear relationship between the
measured and true values characterized by a slope, bias and zero-mean Gaussian distributed noise term. For kth
QI method, denote the slope and bias as uk and vk, respectively. The noise term is denoted as N (0, Σ), where
Σ denotes the covariance matrix. For pth patient, the relationship between the measured quantitative values
and the true value can be written as:
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
u1ap + v1
u2ap + v2
...
ukap + vk

+ N (0, Σ) .
(1)
Denote the vector [u1, v1, , u2, v2 ..., uK, vK] by Θ and the measurements [ˆap,1, ˆap,2, ..., ˆap,K] by ˆ
Ap. Based
on Eq.1, we can obtain the probability distribution of ˆ
Ap, but that depends on the true value. Thus, to estimate
these parameters, the true values are needed. To address this issue, the NGSE techniques assume that the true
quantitative values are sampled from a parametric distribution pr (ap|Ω) characterized by a parameter vector
Ω. Denote all the parameters {Θ, Σ, Ω} as Γ. By further assuming that the true values of different patients are
independent, the log-likelihood function of all the measurements can be derived as follows:
Λ

Γ

n
ˆ
Ap
o
=
P
X
p=1
ln
Z
pr

ˆ
Ap|ap, Θ, Σ

pr (ap|Ω) dap.
(2)
This log-likelihood expression provides the basis for developing the CRB-based framework. More specifically,
based on Eq.2, we can obtain the Fisher information matrix of Γ. By taking the inverse of this matrix, we obtain
the CRB of Γ, denoted as CRB (Γ).
In NGSE techniques, the FoMs used to rank the QI methods are computed from the estimated parameters Γ.
Most commonly, for NGSE techniques that assume a linear relationship between the true and measured values,
the ratio of the noise standard deviation and slope term, referred to as the noise-to-slope ratio (NSR), is used to
rank the QI methods based on precision. Denote the FoM for kth QI method as γk and let γ = [γ1, γ2, ..., γK].
Denote the Jacobian matrix of the function that computes γ from Γ as J. The CRB of γ can be computed
using following equation:
CRB (γ) = J [CRB (Γ)] JT .
(3)
For an unbiased estimator, the best performance for estimating the parameters is that the variance of the
estimated value achieves the CRB, in which case the distribution of the estimated parameters can be considered
approximately normal distributed.15 In this case, the distribution of the estimated FoMs ˆγ is given by:
ˆγ ∼N (γ, CRB (γ)) .
(4)
As the distribution of the estimated FoMs can be obtained when the unbiased estimator achieves the best
performance, an upper bound of ranking the QI methods can thus be computed.
For example, if three QI
methods are being evaluated and the true FoM values have the order γ1 < γ2 < γ3. The upper bound for
correctly ranking the QI methods, denoted as Ucr can be computed using following equation:
Ucr =
ZZZ
ˆγ1<ˆγ2<ˆγ3
pr (ˆγ1, ˆγ2, ˆγ3) d3ˆγ.
(5)
A similar upper bound can be computed for correctly identifying the best QI method.
