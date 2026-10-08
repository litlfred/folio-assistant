---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-011-estimation-and-inference
section_title: "Estimation and Inference"
section_number: null
pages: 14-17
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Given the identification results in the previous section, this section proposes the DMM (debiased
inference with multiple imperfect measurements) estimator and proves its consistency and asymptotic
normality.
First, to estimate the conditional classification rate, we use cross-fitting (Chernozhukov et al.,
2018) and separate estimation of the nuisance function from evaluation of the downstream moment
function. Partition the observations into K folds I1, . . . , IK. For each fold k, estimate the conditional
classification rate model {ηj,0(d), ηj,1(d)}J
j=1 from ( e
Xi, eDi) using observations outside Ik. One option
is to maximize the conditional likelihood
L−k =
X
i/∈Ik
log
"
1
X
a=0
π( eDi)a{1 −π( eDi)}1−a
J
Y
j=1
ηj,a( eDi)X(j)
i {1 −ηj,a( eDi)}1−X(j)
i
#
,
where π( eD) := Pr(X∗= 1 | eD). This likelihood can be maximized using the expectation-maximization
(EM) algorithm (Dempster, Laird and Rubin, 1977), as in Guo et al. (2026). More flexible nuisance
functions can be accommodated by maximizing the same likelihood over sieve spaces (Shen, 1997;
Hu and Schennach, 2008), or alternatively by sieve minimum distance based on conditional moment
restrictions (Chen and Pouzo, 2012; Zhou and Tchetgen Tchetgen, 2024). Each fold-specific fit is
oriented using the same anchoring rule.
As in debiased machine learning (Chernozhukov et al.,
2018), the asymptotic results below do not depend on which particular fitting algorithm researchers
use to estimate the conditional classification rates. Below, we provide high-level requirements for
convergence rates that can be achieved by a wide range of fitting algorithms.
Then, for i ∈Ik, we construct
c
M(−k)
ij
=
X(j)
i
−bη(−k(i))
j,0
( eDi)
bη(−k(i))
j,1
( eDi) −bη(−k(i))
j,0
( eDi)
,
(3.9)
14
where bη(−k(i)) is estimated only using I−k(i), the data excluding the fold k(i) that unit i belongs to.
Then, the cross-fitted moment function for the DMM estimator is
bψDMM( e
Xi, eDi; β, bη(−k(i))) := {1 −bHR
i (bη(−k(i)))}ψF (Yi, 0, Wi; β) + bHR
i (bη(−k(i)))ψF (Yi, 1, Wi; β),
(3.10)
where bHR
i (bη(−k(i))) is defined by equation (3.7) with estimated single-proxy bridge functions in equa-
tion (3.9). Our DMM estimator bβDMM can then be written as the solution to the following equation.
1
n
n
X
i=1
bψDMM( e
Xi, eDi; β, bη(−k(i))) = 0.
Throughout this subsection, the observations are i.i.d., the numbers of proxies J and folds K are
fixed, each fold contains a nonvanishing fraction of the sample, and all fold-specific nuisance estimates
are oriented using the same anchoring rule.
The following theorem presents the asymptotic properties of the DMM estimator.
Theorem 3.2 (Consistency and asymptotic normality). Suppose the assumptions required in The-
orem 3.1 hold. Let B0 ⊂B be a compact neighborhood of β∗, and let bβDMM be a solution of the
sample moment equation in B0, which exists with probability approaching one. We assume the fol-
lowing standard regularity conditions: (a) β∗is the unique well-separated interior root on B0; (b)
for a ∈{0, 1}, the moment functions ψF (Y, a, W; β) and their Jacobians are Lipschitz in β on B0
with square-integrable envelopes, the population Jacobian A0 defined below is nonsingular, and there
exists a finite constant C such that supβ∈B0

ψF (Y, 1, W; β) −ψF (Y, 0, W; β)

 ≤C a.s.; (c) the true
and fitted class contrasts, {η∗
j,1( eD) −η∗
j,0( eD)}J
j=1 and {{bη(−k)
j,1 ( eD) −bη(−k)
j,0 ( eD)}J
j=1}K
k=1, are uniformly
bounded away from zero over eD, the latter with probability approaching one, and (d) for every k, j,
a, bη(−k)
j,a ( eD) takes values in [0, 1] almost surely.
Define the maximum fold-specific nuisance error.
δn = max
k,j,a

bη(−k)
j,a
−η∗
j,a

2,P ,
where η∗
j,a is the true classification rate and the norm is taken over the distribution of eD. If the
nuisance function estimation is consistent, i.e., δn = op(1), then bβDMM
p→β∗. More generally, the
DMM estimator achieves multiple robustness for consistency: consistency of the DMM estimator
requires the convergence of the nuisance functions to the true functions for only J −1 proxies, and
one does not need to know which J −1 classification rates are consistently estimated.
If the nuisance function estimator converges at a slow nonparametric rate, i.e., δn = op(n−1/4),
√n(bβDMM −β∗) =
1
√n
n
X
i=1
A−1
0 ψDMM( e
Xi, eDi; β∗, η∗) + op(1),
(3.11)
and
√n(bβDMM −β∗) ⇝N

0, A−1
0 Ω0A−⊤
0

(3.12)
where
A0 = −E

{1 −HR( e
X, eD; η∗)} ∂
∂β⊤ψF (Y, 0, W; β∗) + HR( e
X, eD; η∗) ∂
∂β⊤ψF (Y, 1, W; β∗)

,
Ω0 = E
h
ψDMM( e
X, eD; β∗, η∗)ψDMM( e
X, eD; β∗, η∗)⊤i
.
15
The rate requirement for the nuisance function estimation bη follows from Proposition 3.1: the
population remainder caused by estimating the conditional classification rate is second order in the
nuisance function estimation error. Cross-fitting controls the corresponding empirical process term
without requiring restrictive Donsker conditions, following the logic of locally robust estimation
(Chernozhukov et al., 2022). A proof is provided in Appendix A.2.
To estimate the asymptotic variance, we evaluate the cross-fitted moment function at bβDMM and
define
bA = −1
n
n
X
i=1

{1 −bHR
i (bη(−k(i)))} ∂
∂β⊤ψF (Yi, 0, Wi; bβDMM) + bHR
i (bη(−k(i))) ∂
∂β⊤ψF (Yi, 1, Wi; bβDMM)

,
(3.13)
bΩ= 1
n
n
X
i=1
ψDMM( e
Xi, eDi; bβDMM, bη(−k(i)))ψDMM( e
Xi, eDi; bβDMM, bη(−k(i)))⊤,
(3.14)
bV = bA−1 bΩbA−⊤.
(3.15)
Then bV/n estimates the covariance matrix of bβDMM. For any fixed contrast c, an asymptotic (1−α)
confidence interval for c⊤bβDMM is
c⊤bβDMM ± z1−α/2
s
c⊤bVc
n
,
where z1−α/2 is the (1 −α/2) percentile of the standard normal distribution. For the generalized
linear model example in Section 2, c may select the coefficient on the latent regressor.
Discussion on Efficiency.
The robust bridge is designed to remove first-order nuisance bias. Here, we examine how the asymp-
totic precision of this estimator changes with the number and quality of the labels.
Write HR
0,J to emphasize that the bridge uses J proxies. Then, the DMM moment function admits
the decomposition
ψDMM
J
( e
X, eD; β∗, η∗) = ψF (Y, X∗, W; β∗) + {HR
0,J −X∗}∆ψ0(Y, W),
(3.16)
where ∆ψ0(Y, W) = ψF (Y, 1, W; β∗) −ψF (Y, 0, W; β∗). The unbiasedness of the bridge function
implies that the population bread matrix equals its oracle counterpart.
A0 = −E
"
∂ψF (Y, X∗, W; β)
∂β⊤

β=β∗
#
.
(3.17)
Thus, the number and quality of the labels affect the asymptotic variance only through the meat
matrix:
ΩR
0,J = ΩF
0 + E
h
{HR
0,J −X∗}2∆ψ0(Y, W)∆ψ0(Y, W)⊤i
(3.18)
where ΩF
0 := E

ψF (Y, X∗, W; β∗)ψF (Y, X∗, W; β∗)⊤
. We use VR
0,J := A−1
0 ΩR
0,JA−⊤
0
to denote the
asymptotic variance of the DMM estimator using J proxies, and we use VF
0 := A−1
0 ΩF
0 A−⊤
0
to denote
the asymptotic variance of an infeasible, oracle estimator that uses unobserved X∗in downstream
moments.
16
For a fixed linear combination of coefficients c⊤β∗, we can write the asymptotic variance of the
DMM estimator as follows.
c⊤VR
0,Jc = c⊤VF
0 c + E
" 1
X
a=0
π( eDi)a{1 −π( eDi)}1−avR
a,J( eD){(A−⊤
0
c)⊤∆ψ0(Y, W)}2
#
,
(3.19)
where vR
a,J(d) := V

HR
0,J | X∗= a, eD = d

. Importantly, only vR
a,J(d) depends on the selection of
proxies. Hence, decreasing vR
a,J(d) is sufficient to improve precision for downstream parameters of
interest.
For proxy j, define its conditional single bridge variance
κj,a(d) :=
η∗
j,a(d){1 −η∗
j,a(d)}
{η∗
j,1(d) −η∗
j,0(d)}2 .
Then, we can express the conditional variance of the bridge function as follows.
vR
a,J(d) =
9
 J
2
2
X
j1<j2
κj1,a(d)κj2,a(d) +
4
 J
3
2
X
j1<j2<j3
κj1,a(d)κj2,a(d)κj3,a(d).
(3.20)
Suppose an additional proxy has conditional bridge variance κJ+1,a(d).
Appendix B derives an
explicit threshold κJ,a(d) such that, except in the degenerate zero-variance case,
vR
a,J+1(d) < vR
a,J(d)
⇐⇒
κJ+1,a(d) < κJ,a(d).
Thus, adding a proxy improves precision when the conditional variance of its single-proxy bridge
function is small enough relative to those of the existing proxies. For example, a proxy with a very
small class contrast, ηj,1(d) −ηj,0(d), has a large κj,a(d) and can increase the variance of the bridge
function vR
a,J+1(d). More proxies therefore do not mechanically improve this particular estimator. It
is straightforward to allow for different weights when constructing the robust bridge function so that
it can guarantee the DMM estimator with J + 1 proxies is at least as efficient as the DMM estimator
with J proxies.
In a special case where every proxy has the same conditional variance κa(d),
vR
a,J(d) = 18κa(d)2
J(J −1) +
24κa(d)3
J(J −1)(J −2),
which decreases with J at rate J−2, i.e., more proxies lead to higher accuracy for downstream
parameter estimation.
4
