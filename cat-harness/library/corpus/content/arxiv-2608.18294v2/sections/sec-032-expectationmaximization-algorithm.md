---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-032-expectationmaximization-algorithm
section_title: "Expectation–Maximization Algorithm"
section_number: null
pages: 42-43
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Let ξ(t)
i
= Prθ(t)(L∗
i = 1 | eLi, Zi) denote the posterior responsibility at iteration t. For compactness,
define
f(t)
ij,a = {η(t)
ij,a}L(j)
i {1 −η(t)
ij,a}1−L(j)
i .
The E-step is
ξ(t)
i
=
p(t)
i
QJ
j=1 f(t)
ij,1
(1 −p(t)
i ) QJ
j=1 f(t)
ij,0 + p(t)
i
QJ
j=1 f(t)
ij,1
.
(C.2)
The production code evaluates equation (C.2) on the log scale using a log-sum-exp calculation.
Given ξ(t)
i , the M-step separates into standard logistic regression problems. The latent prevalence
model is updated by a fractional-response logistic regression of ξ(t)
i
on Zi:
α(t+1) = arg max
α
n
X
i=1
h
ξ(t)
i
log pi(α) + {1 −ξ(t)
i } log{1 −pi(α)}
i
.
For each proxy j, the class-specific response models are updated by weighted logistic regressions:
γ(t+1)
j,1
= arg max
γ
n
X
i=1
ξ(t)
i
log fj{L(j)
i
| 1, Zi; γ},
γ(t+1)
j,0
= arg max
γ
n
X
i=1
{1 −ξ(t)
i } log fj{L(j)
i
| 0, Zi; γ}.
Thus, ξ(t)
i
and 1 −ξ(t)
i
act as the effective class-one and class-zero weights. The M-step produces
updated p(t+1)
i
and η(t+1)
ij,a , which are then used in the next E-step.
The algorithm is initialized from several posterior-responsibility vectors. The candidate starts
include the row-wise proxy mean, its complement, single-proxy starts of the form 0.1 + 0.8L(j)
i , and
42
Table C.1: Shared settings for the low-dimensional logistic EM implementation.
Quantity
Setting
Number of starts
6
Maximum EM iterations
500
Posterior-change tolerance
maxi |ξ(t)
i
−ξ(t−1)
i
| < 10−5
Per-observation likelihood tolerance
| log L(θ(t)) −log L(θ(t−1))|/n < 10−7
Logistic coefficient clipping
[−20, 20]
Probability clipping
[10−8, 1 −10−8]
Bridge denominator floor
0.05
random draws from Uniform(0.2, 0.8) when additional starts are needed. We use six starts and retain
the solution with the largest final observed-data log-likelihood in equation (C.1).
Because the latent classes are identified only up to a common permutation, we orient each fitted
solution after its final EM update. All proxies are coded so that one denotes the substantive positive
class. We therefore require the average fitted proxy contrast to be positive:
1
nJ
n
X
i=1
J
X
j=1
(bηij,1 −bηij,0) > 0.
(C.3)
If the fitted contrast is negative, we replace bξi by 1−bξi and refit the latent-prevalence and class-specific
proxy regressions. This is the implementation counterpart of the anchoring condition in Section 3.
Convergence and numerical safeguards.
The settings used in both applications are summarized
in Table C.1. Convergence requires both a small maximum change in posterior responsibilities and a
small absolute change in the observed log-likelihood per observation. Coefficients and probabilities
are clipped only for numerical stability.
The general theory is stated using cross-fitting so that flexible nuisance learners can be ac-
commodated without restrictive empirical-process conditions. The application studies use the low-
dimensional parametric implementation above; for this finite-dimensional smooth nuisance class, the
usual parametric M-estimation conditions replace the role of outer cross-fitting.
Specifically, the
shared EM engine is fit once on the analysis sample in each Fowler replication or Pan–Chen boot-
strap resample. The two application adapters differ only in the construction of the proxy matrix and
Zi; both call the same EM algorithm with the settings in Table C.1.
C.2.2
