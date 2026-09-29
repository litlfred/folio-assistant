---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-016-gp-ts-expected-regret-bound
section_title: "GP-TS: Expected Regret Bound"
section_number: null
pages: 21-24
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
Unlike the previous section, here, we study a different proof technique: showing a regret bound in
expectation. I.e., instead of proving a high-probability regret bound, we shall prove the expected
regret E(𝑅𝑇). Note that this analysis is weaker than the high-probability analysis one since we
only consider the average case, e.g. there might be some unexpected cases/outliers that are not
taken into account by the expectation.
Thompson sampling (TS) is an algorithm where 𝑥𝑡= argmax𝑥∈X ˆ𝑓where ˆ𝑓∼𝑝( 𝑓| D𝑡).
In other words, 𝑥𝑡∼𝑝(𝑥∗| D𝑡) since the sampling process above is a single-sample Monte-
Carlo approximation of 𝑝(𝑥∗| D𝑡) =
R
𝛿(argmax 𝑓) 𝑝( 𝑓| D𝑡) 𝑑𝑓, where 𝛿is the Dirac delta
distribution. We consider the case where the posterior 𝑝( 𝑓| D𝑡) is a GP posterior GP(𝜇𝑡, 𝑘𝑡)
and call the algorithm GP-TS. The analysis below is adapted from Russo and Van Roy (2014).
Theorem 5.2 (Discrete GP-Thompson-Sampling). Let 𝑋be a finite set and 𝑓: X →R.
Assume 𝑓∼GP(0, 𝑘) is in the sample paths of the GP prior and w.l.o.g., the marginal variance
of the GP is bounded 𝑘(𝑥, 𝑥) ≥1 for any 𝑥∈X. For all time horizons 𝑇≥1, GP-TS algorithm
has expected regret
E(𝑅𝑇) ≤O∗√︁
𝑇𝛾𝑇log |X |

,
where 𝛾𝑇is the information capacity of the GP (4.8) and O∗is O with some log-factors supressed.
Proof. Fix a 𝑡≥1. By the algorithm, since 𝑥𝑡∼𝑝(𝑥∗| D𝑡), the chosen context point 𝑥𝑡and the
maximizer 𝑥∗are identically distributed under the current posterior. That is, 𝑝(𝑥∗| D𝑡) = 𝑝(𝑥𝑡|
𝐷𝑡). Let 𝑈𝑡(𝑥, D𝑡) be any upper confidence bound derived from the posterior, i.e., a function
with the form 𝑈𝑡(𝑥, D𝑡) = 𝜇𝑡(𝑥) + 𝛽𝑡𝜎𝑡(𝑥) for an arbitrary 𝛽𝑡> 0.
Note that given the dataset 𝐷𝑡, the upper confidence bound𝑈𝑡(𝑥, D𝑡) is a deterministic function
of 𝑥. E.g., in the case of UCB, 𝑈𝑡is a deterministic function of 𝑥given the posterior mean and
standard deviation under D𝑡. This implies
E[𝑈𝑡(𝑥∗, D𝑡) | D𝑡] = E[𝑈𝑡(𝑥𝑡, D𝑡) | D𝑡].
By definition of the expected regret, E(𝑅𝑇) = P𝑇
𝑡=1 E(𝑟𝑡) = P𝑇
𝑡=1 E[ 𝑓(𝑥∗) −𝑓(𝑥𝑡)]. By the
law of total expectation, the summand is:
E(𝑟𝑡) = ED𝑡[E( 𝑓(𝑥∗) −𝑓(𝑥𝑡) | D𝑡)]
= ED𝑡[E[ 𝑓(𝑥∗) −𝑓(𝑥𝑡) | D𝑡] + E[𝑈𝑡(𝑥𝑡, D𝑡) | 𝐷𝑡] −E[𝑈𝑡(𝑥∗, D𝑡) | D𝑡]
|                                                 {z                                                 }
=0
]
= ED𝑡[E[ 𝑓(𝑥∗) −𝑓(𝑥𝑡) + 𝑈𝑡(𝑥𝑡, D𝑡) −𝑈𝑡(𝑥∗, D𝑡) | D𝑡]]
20
5 Discrete Bayesian Optimization
= ED𝑡[E[ 𝑓(𝑥∗) −𝑈𝑡(𝑥∗, D𝑡) | D𝑡] + E[𝑈𝑡(𝑥𝑡, D𝑡) −𝑓(𝑥𝑡) | D𝑡]],
Where the inner expectation is w.r.t. the posterior 𝑝( 𝑓| D𝑡). This implies that
E(𝑅𝑇) =
𝑇
∑︁
𝑡=1
ED𝑡[E[ 𝑓(𝑥∗) −𝑈𝑡(𝑥∗, D𝑡) | D𝑡)] +
𝑇
∑︁
𝑡=1
ED𝑡[E[𝑈𝑡(𝑥𝑡, D𝑡) −𝑓(𝑥𝑡) | D𝑡]].
Our task is to bound these two sums.
For the first sum, let 𝛽𝑡in 𝑈𝑡(𝑥, D𝑡) be
𝛽𝑡=
√︄
2 log (𝑡2 + 1)|X |
√
2𝜋
.
Let 𝑧𝑡(𝑥) := 𝑓(𝑥) −𝑈𝑡(𝑥, D𝑡) for brevity. Since at time 𝑡, for any 𝑥, the function value 𝑓(𝑥) is
N (𝜇𝑡(𝑥), 𝜎2
𝑡(𝑥)), and since Gaussians are closed under affine transformations,4 we have that
𝑧𝑡(𝑥) = ( 𝑓(𝑥) −𝜇𝑡(𝑥) −𝛽𝑡𝜎𝑡(𝑥)) ∼N (−𝛽𝑡𝜎𝑡(𝑥), 𝜎2
𝑡(𝑥)).
Notice that the mean is nonpositive. So, by Theorem 2.13 and by our choice of 𝛽𝑡, we have
E(𝑧𝑡(𝑥) I(𝑧𝑡(𝑥) ≥0) | D𝑡) = 𝜎𝑡(𝑥)
√
2𝜋
exp
−𝛽𝑡
2

=
𝜎𝑡(𝑥)
(𝑡2 + 1)|X | ≤
1
(𝑡2 + 1)|X |,
where the last inequality uses the hypothesis that 𝜎𝑡(𝑥) ≤
√︁
𝑘(𝑥, 𝑥) ≤1.5 We only care about the
event where 𝑧𝑡(𝑥) ≥0 since those nonnegative values are the contributing factors to our upper
bound. Notice that this bound does not depend on D𝑡and thus taking the expectation w.r.t. D𝑡
on both sides yields E(𝑧𝑡(𝑥) I(𝑧𝑡(𝑥) ≥0)) ≤1/((𝑡2 + 1)|X |).
And so, by summing over 𝑡, we arrive at:
𝑇
∑︁
𝑡=1
E[ 𝑓(𝑥∗) −𝑈𝑡(𝑥∗, D𝑡)] ≤
∞
∑︁
𝑡=1
∑︁
𝑥∈X
E[𝑧𝑡(𝑥) I(𝑧𝑡(𝑥) ≥0)]
≤
∞
∑︁
𝑡=1
∑︁
𝑥∈X
1
(𝑡2 + 1)|X |
=
∞
∑︁
𝑡=1
1
(𝑡2 + 1) .
This series converges to some constant 𝐶≤1, and can later be absorbed in the O-notation.
4If 𝑧∼N (𝜇, 𝜎2), then 𝑎𝑧+ 𝑏∼N (𝑎𝜇+ 𝑏, 𝑎2𝜎2) for constants 𝑎and 𝑏.
5Intuitively, posterior inference in GPs reduces the initial uncertainty. Picture: the GP uncertainty is “clamped”
around an observation point.
21
5 Discrete Bayesian Optimization
For the second sum, notice that 𝑈𝑡(𝑥𝑡, D𝑡) −𝑓(𝑥𝑡) is distributed as N (𝛽𝑡𝜎𝑡(𝑥), 𝜎2
𝑡(𝑥)) using
the same argument as before. So, under a choice of D𝑡, it has the expected value 𝛽𝑡𝜎𝑡(𝑥).
Therefore, we obtain:
𝑇
∑︁
𝑡=1
E[𝑈𝑡(𝑥𝑡, D𝑡) −𝑓(𝑥𝑡)] = ED𝑡
 𝑇
∑︁
𝑡=1
𝛽𝑡𝜎𝑡(𝑥𝑡)
!
≤ED𝑡
 
𝛽𝑇
𝑇
∑︁
𝑡=1
𝜎𝑡(𝑥𝑡)
!
(𝛽𝑡nondecreasing)
≤ED𝑡
©­
«
𝛽𝑇
v
u
t
𝑇
𝑇
∑︁
𝑡=1
𝜎2
𝑡(𝑥𝑡)ª®
¬
(Cauchy-Schwarz)
≤ED𝑡

𝛽𝑇
√︁
𝑇O(𝛾𝑇)

(Theorem 4.1)
≤𝛽𝑇
√︁
𝑇O(𝛾𝑇)
(No dependence on D𝑡anymore)
= O∗√︁
𝑇𝛾𝑇log |X |

.
(Substituting in 𝛽𝑇)
Altogether, we conclude that E(𝑅𝑇) ≤𝐶+ O∗(
√︁
𝑇𝛾𝑇log |X |) and the proof is complete.
□
22
Chapter 6
