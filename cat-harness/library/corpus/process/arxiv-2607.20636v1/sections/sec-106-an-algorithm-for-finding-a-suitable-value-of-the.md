---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-106-an-algorithm-for-finding-a-suitable-value-of-the
section_title: "An Algorithm for Finding a Suitable Value of the Parameter"
section_number: null
pages: 145-148
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this section, we provide a natural algorithm for finding a suitable value of the parameter
α for the PTRR algorithm based on access to instances. We then analyze the sample
complexity, runtime complexity, and performance of the algorithm.
At a high level, the algorithm starts by (approximately) identifying the underlying
value of the CEE, βi for each instance i in the training set. Then, we aggregate estimated
values ˆβi are aggregated by taking the maximum and that aggregated value (or 1, if it is
bigger than 1) is returned as a value of α to use in future deployments. We now present
a very general version of the result.
Algorithm 7 Approximate Learner
1: Require: n samples from distribution D
2: for each instance Ii do
3:
ˆβi ←CEE Oracle(Ii)
4: end for
5: β ←maxi ˆβi
6: return β
130
For both steps, we can adjust the sophistication of the protocols. For the first step,
we start by assuming we have an oracle that returns CEE(I) for any instance I . We can
implement an approximate oracle by dividing the interval (0, 1] into subintervals of size
ϵ and binary searching over that discrete set for the smallest satisfying value. Similarly,
for the second step, it is easiest to analyze the aggregation protocol that simply takes the
maximum. However, this has the awkward property that with more samples, the predicted
parameter increases toward the supremum of the support of the induced distribution over
βs. Instead, we ought to use a 1 −δ order statistic that concentrates around its mean.
This implies discarding some probability mass as part of the failure probability.
At a high level, in order to argue that this algorithm provides interesting, non-vacuous
guarantees on the performance of PTRR with the learned parameter on a new instance
drawn from the same distribution, we argue that the learned value of the parameter is
good for a good fraction of the support of the distribution. To argue about this, we first
define the induced distribution over β:
Definition B.3.3. For each instance Ii drawn from the distribution D , suppose we com-
pute βi = CEE(I). We call the distribution over the βi the induced distribution over
βs.
Next, we define the optimal parameter α⋆for the distribution.
Definition B.3.4. Define α⋆as the maximizer of the expected competitive ratio over the
distribution of instances. In particular, α⋆:= arg maxα∈(0,1] EItest∼D
h
Rew(PTRRα,Itest)
OPT(Itest)
i
.
Now, assuming the induced distribution over β for a distribution D has some density
and cumulative density, we can show that, for a fixed number of samples, with quantifiable
probability (approaching 1 as the number of samples goes to infinity), we can bound the
reward ratio in terms of the learned parameter. We formalize this in the theorem below.
Theorem B.3.5. Suppose the induced distribution over βs has density f(β) and cumu-
lative density F(β) . Suppose we run Algorithm 7 with a fixed number of samples n > 10
and receive ˆα as the learned value of the parameter.
If ˆα ≥1 , we run PTRR1 and
achieve 1/
√
k fraction of the reward. Otherwise, with probability

1
n+1
1/n 
n
n+1

(which
approaches 1 as n →∞) over the test sample and the training samples, the reward of
running PTRRˆα on the test sample is at least 1/kˆα/(ˆα+1) fraction of running PTRRα⋆
on that instance. That is:
Rew(PTRRˆα, Itest)
Rew(PTRRα⋆, Itest) ≥Ω

1
kˆα/(ˆα+1)

.
(B.13)
Remark 8. Note that this is different to the PAC guarantee given by ERM in two impor-
tant ways. First, we cannot choose arbitrarily small failure probability and error values
and draw a number of samples that is a function of those. Secondly, we are providing a
guarantee for a single fixed test instance drawn from the distribution, not for the “average”
test instance. In particular, we are using the fact that PTRR with the best value of the
parameter for the distribution cannot get more reward on the instance than the optimal
reward achievable on that instance.
131
Proof. In order to prove this result, at a high-level, we will show that even if we resign
ourselves to failure on a small fraction of the distribution (i.e., bad approximation ratio),
we can still achieve a good approximation with high probability on the rest. To show this,
we proceed in three steps:
1. First, we define two events that are crucial to our guarantee: first, that the learned
ˆα is sufficiently large; second, that the test example is sufficiently nice.
2. We argue that for any test example for which the CEE is at most τ , running PTRRˆα
obeys the reward ratio in Eqn. B.13 as long as ˆα ≥τ.
3. We argue that with good probability over the training sample, ˆα ≥τ , and with
good probability over the test instance, CEE(Itest) ≤τ . Thus, we can combine
the probabilities of the relevant events to show that with the stated probability, the
reward ratio guarantee holds.
Relevant Events
At a high level, our strategy will be to resign ourselves to failure
on a small fraction of the support of the induced distribution over βs in the interest of
guaranteeing an approximation on the rest of the support. To that end, we define the
following two events:
E1 := {ˆα ≥τ}
(B.14)
E2 := {CEE(Itest) ≤τ}
(B.15)
We know from the analysis in Section 4.3 that for an instance with CEE β , running
PTRRα for any α ≥β will achieve 1/kα/(α+1) fraction of the optimal reward. Thus, on
a new test example, provided the value of the PTRR parameter we use is larger than the
CEE of the instance, we will accrue sufficient reward. We formalize this subsequently.
Reward Ratio Holds
Now, recall from Theorem 4.3.1 that for an instance with CEE
βI , PTRRα for any α > βI accrues O(OPT/kα/(α+1)) reward. Thus, if ˆα > τ > βtest :=
CEE(Itest) , the Rew(PTRRˆα, Itest) ≥O(OPT/kα/(α+1)) . Finally, we observe that by
the definition of OPT , we have that OPT ≥Rew(PTRRα, Itest) ∀α , so in particular this
holds for α = α⋆, the value of α for which the expected competitive ratio is maximized.
Thus, we have that if ˆα ≥τ and CEE(Itest) ≤τ , then:
Rew(PTRRˆα, Itest)
Rew(PTRRα⋆, Itest) ≥O

1
kˆα/(ˆα+1)

.
Thus, it remains to argue that the conditions in the previous statement occur with
good probability.
132
Probability
First, let us consider event P [E2] . This is simply the cumulative density
at β = τ , F(τ) . Next, we analyze P [E1] :
P [E1] = P [ˆα ≥τ]
(B.16)
= P

max
i
ˆβi ≥τ

(B.17)
under oracle = 1 −P [∀i βi ≤τ]
(B.18)
= 1 −F(τ)n .
(B.19)
The probability of success is the probability of the intersection of these two events, so the
probability of success is F(τ)(1 −F(τ)n) . Now, it suffices to show that we can pick a τ
that gives us a good probability of success. We can therefore pick the τ that maximizes
the probability of success, namely arg maxτ F(τ)(1 −F(τ)n) .
max
τ
F(τ)(1 −F(τ)n) ⇔f(τ) −(n + 1)F(τ)nf(τ) = 0
(B.20)
f(τ) (1 −(n + 1)F(τ)n) = 0
(B.21)
1
n + 1 = F(τ)n
(B.22)
τ = F −1
 
1
n + 1
1/n!
.
(B.23)
Plugging this back into the probability of success, we get the stated result.
B.3.6
