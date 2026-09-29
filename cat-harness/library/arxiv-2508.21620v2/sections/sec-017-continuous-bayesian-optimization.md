---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-017-continuous-bayesian-optimization
section_title: "Continuous Bayesian Optimization"
section_number: null
pages: 24-28
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
We focus on UCB but now assume that the domain X of the unknown function 𝑓: X →R
is continuous. The assumption here is that X ⊂[0, 𝑚]𝑑⊂R𝑑compact and convex. This
assumption is quite practical since normalization/standardization of inputs (and outputs, for that
matter) in continuous BO is standard. The proof strategy here is to obtain a discretization X𝑡
of X at each time step 𝑡. Then, in conjunction with a Lipschitz continuity assumption on the
sample paths of the GP prior, we extend the regret bound on the discrete space into a continuous
space with a known bound.
First, we show that the Lipschitz assumption is quite weak—it is applicable to many standard
kernels. Based on the Borell-TIS inequality (Theorem 4.2), we have the following proposition.
Propositon 6.1. Let GP(0, 𝑘) be a centered GP on a compact 𝑑-dimensional domain X with
continuously differentiable sample paths 𝑓∼GP(0, 𝑘). If 𝐿:= max𝑖𝜕𝑓/𝜕𝑥𝑖, then for all 𝜆> 0,
P(𝐿> 𝜆) ≤𝑑𝑎exp

−𝜆2
𝑏2

,
for some constants 𝑎, 𝑏> 0.
Now we are ready to state and prove the main result (Srinivas et al., 2010).
Theorem 6.2 (Continuous GP-UCB). Let 𝑋⊂[0, 𝑚]𝑑compact and convex with 𝑑∈N and
𝑚> 0. Assume w.l.o.g. that the marginal variance of the GP on X is bounded 𝑘(𝑥, 𝑥) ≤1 for
any 𝑥∈X. If the objective function 𝑓: X →R is Lipschitz continuous with a Lipschitz constant
𝐿and it is in the sample paths of the GP prior, i.e. 𝑓∼GP(0, 𝑘), then, for any 𝛿∈(0, 1) and
for all time horizons 𝑇≥1, with
𝛽𝑡=
√︃
2 log(2𝜋𝑡2(𝐿𝑚𝑑𝑡2)𝑑/6𝛿),
the GP-UCB algorithm has regret
𝑅𝑇≤O∗√︁
𝑇𝛾𝑇𝑑

with probability ≥1 −𝛿,
where 𝛾𝑇is the information capacity of the GP (4.8) and O∗is O with some log-factors
suppressed.
23
6 Continuous Bayesian Optimization
Proof. Since 𝑓is 𝐿-Lipschitz,
| 𝑓(𝑥) −𝑓(𝑥′)| ≤𝐿∥𝑥−𝑥′∥
for any 𝑥, 𝑥′ ∈X .
For each 𝑡, choose a discretization X𝑡of X of size |X𝑡| = 𝜏𝑑
𝑡so that for all 𝑥∈X,
∥𝑥−[𝑥]𝑡∥≤𝑚𝑑
𝜏𝑡
,
where [𝑥]𝑡:= argmin𝑥′∈X𝑡∥𝑥−𝑥′∥. Note that a regular grid with 𝜏𝑡many uniformly placed
points is sufficient.
Together they imply that for all 𝑥∈X:
| 𝑓(𝑥) −𝑓([𝑥]𝑡)| ≤𝐿∥𝑥−[𝑥]𝑡∥≤𝐿𝑚𝑑
𝜏𝑡
.
By choosing 𝜏𝑡= 𝐿𝑚𝑑𝑡2, i.e. by choosing |X𝑡| = (𝐿𝑚𝑑𝑡2)𝑑, we have for all 𝑥∈X that
| 𝑓(𝑥) −𝑓([𝑥]𝑡)| ≤1
𝑡2 .
(6.1)
Let 𝑥∗∈X be the maximizer of 𝑓. Let D𝑡= {(𝑥𝑖, 𝑦𝑖)}𝑡−1
𝑖=1 be the dataset up until 𝑡−1. We
assume that the following events hold:
𝐸1 = { 𝑓(𝑥𝑡) ∈𝐶𝑡(𝑥𝑡) for all 𝑡≥1},
𝐸2 = { 𝑓( ˆ𝑥) ∈𝐶𝑡( ˆ𝑥) for all ˆ𝑥∈X𝑡and for all 𝑡≥1},
where 𝐶𝑡(·) = [𝜇𝑡(·) −𝛽𝑡𝜎𝑡(·), 𝜇𝑡(·) + 𝛽𝑡𝜎𝑡(·)] is the confidence interval under the GP posterior
w.r.t. D𝑡.
The event 𝐸2 implies that for all ˆ𝑥∈X𝑡, we have that 𝑓( ˆ𝑥) ≤𝜇𝑡( ˆ𝑥) + √𝛽𝑡𝜎𝑡( ˆ𝑥). Combining
this with (6.1), we have that: (Notice that [𝑥∗]𝑡∈X𝑡.)
𝑓(𝑥∗) −𝑓([𝑥∗]𝑡) ≤1
𝑡2
⇐⇒𝑓(𝑥∗) ≤𝑓([𝑥∗]𝑡) + 1
𝑡2
⇐⇒𝑓(𝑥∗) ≤𝜇𝑡([𝑥∗]𝑡) + 𝛽𝑡𝜎𝑡([𝑥∗]𝑡) + 1
𝑡2 ,
holds for every 𝑡≥1. Moreover, if 𝑥𝑡∈X is the selected context point at time 𝑡, then, by the
algorithm and due to the event 𝐸1, we have that 𝜇𝑡(𝑥𝑡) + 𝛽𝑡𝜎𝑡(𝑥𝑡) ≥𝜇𝑡([𝑥∗]𝑡) + 𝛽𝑡𝜎𝑡([𝑥∗]𝑡).
Therefore,
𝑓(𝑥∗) ≤𝜇𝑡(𝑥𝑡) + 𝛽𝑡𝜎𝑡(𝑥𝑡) + 1
𝑡2 .
We can thus bound the instantaneous regret by:
𝑟𝑡= 𝑓(𝑥∗) −𝑓(𝑥𝑡)
≤𝜇𝑡(𝑥𝑡) + 𝛽𝑡𝜎𝑡(𝑥𝑡) + 1
𝑡2 −𝑓(𝑥𝑡)
24
6 Continuous Bayesian Optimization
= UCB(𝑥𝑡) −𝑓(𝑥𝑡) + 1
𝑡2
≤2𝛽𝑡𝜎𝑡(𝑥𝑡) + 1
𝑡2 .
The last inequality follows since 𝑓(𝑥𝑡) ≥LCB(𝑥𝑡).
Pick a time horizon 𝑇≥1. Since 𝛽𝑡is non-decreasing, 𝛽𝑡≤𝛽𝑇for 𝑡≤𝑇. Therefore, as in the
discrete case, we obtain
𝑇
∑︁
𝑡=1
(2𝛽𝑡𝜎𝑡(𝑥𝑡))2 ≤4
𝑇
∑︁
𝑡=1
𝛽2
𝑡𝜎2
𝑡(𝑥𝑡) ≤4𝛽2
𝑇
𝑇
∑︁
𝑡=1
𝜎2
𝑡(𝑥𝑡) ≤O(𝛽2
𝑇𝛾𝑇),
where we have used Theorem 4.1 to bound the sum of the predictive variances. By the Cauchy-
Schwarz inequality, we obtain
 𝑇
∑︁
𝑡=1
2𝛽𝑡𝜎𝑡(𝑥𝑡)
!2
≤𝑇
𝑇
∑︁
𝑡=1
(2𝛽𝑡𝜎𝑡(𝑥𝑡))2.
Therefore,
𝑇
∑︁
𝑡=1
𝑟𝑡≤
𝑇
∑︁
𝑡=1
2𝛽𝑡𝜎𝑡(𝑥𝑡) +
𝑇
∑︁
𝑡=1
1
𝑡2
≤O
√︃
𝑇𝛽2
𝑇𝛾𝑇

+
𝑇
∑︁
𝑡=1
1
𝑡2
≤O
√︃
𝑇𝛽2
𝑇𝛾𝑇

+ 𝜋
6
= O
√︃
𝑇𝛽2
𝑇𝛾𝑇

,
where the last inequality follows from the Riemann zeta function P∞
𝑡=1 1/𝑡2 = 𝜋/6. By substituting
𝛽𝑡from the hypothesis into the above inequality, we obtain the desired regret bound.
The remaining task is to bound the probability of the event 𝐸= 𝐸1 ∩𝐸2, which we have
assumed when we derived the regret bound above.
First, we check each event 𝐸1 and 𝐸2
individually.
Event 𝑬1
For 𝐸1, notice that 𝛽2
𝑡= 2 log(2𝜋𝑡2(𝐿𝑚𝑑𝑡2)𝑑/6𝛿) ≥2 log(2𝜋𝑡2/6𝛿) since (𝐿𝑚𝑑𝑡2)𝑑is
positive and log is increasing. Then, by Theorem 2.12, we note that for each 𝑡≥1,
P(| 𝑓(𝑥𝑡) −𝜇𝑡(𝑥𝑡)| ≥𝛽𝑡𝜎(𝑥𝑡)) ≤exp(−𝛽2
𝑡/2) ≤6𝛿
2𝜋𝑡2 .
Then, through the union bound over 𝑡≥1, we have
P(𝐸𝑐
1) ≤6𝛿
2𝜋
∞
∑︁
𝑡=1
1
𝑡2 = 𝛿
2.
25
6 Continuous Bayesian Optimization
Event 𝑬2
Meanwhile, for 𝐸2, notice that 𝛽2
𝑡= 2 log(2𝜋𝑡2|X𝑡|/6𝛿) since we have chosen |X𝑡| =
(𝐿𝑚𝑑𝑡2)𝑑. Then, by Theorem 2.12 again, we have that for each ˆ𝑥∈X𝑡and each 𝑡≥1:
P(| 𝑓( ˆ𝑥) −𝜇𝑡( ˆ𝑥)| ≥𝛽𝑡𝜎( ˆ𝑥)) ≤exp(−𝛽2
𝑡/2) ≤
6𝛿
2𝜋𝑡2|X𝑡| .
So, through the union bound over ˆ𝑥∈X𝑡, the probability is at most 6𝛿/2𝜋𝑡2. And then, through
the union bound over 𝑡≥1, we obtain P(𝐸𝑐
2) ≤𝛿
2 , as in the case of 𝐸1.
Altogether, they imply that
P(𝐸𝑐) = P(𝐸𝑐
1 ∪𝐸𝑐
2) = P(𝐸𝑐
1) + P(𝐸𝑐
2) ≤𝛿
2 + 𝛿
2 = 𝛿.
This implies that P(𝐸) ≥1 −𝛿.
□
26
