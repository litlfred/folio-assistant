---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-070-modelling-grit-discomfort-tolerance
section_title: "Modelling Grit: Discomfort Tolerance"
section_number: null
pages: 101-103
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this setting, we study another relevant aspect of grit, namely discomfort tolerance. To
do so, let us first introduce a cost to playing the striving arm.
Cost to strive
Let us consider a setting in which there is a cost to strive. The reward
profile / bandit arms f1 and f2 look almost as before, with α = 1 : f1(t) = 1 ∀t and
f2(t) =
(
−1
t < θ
t −θ
t ≥θ .
The negative reward models the cost of striving, for instance financial debt or effort
expenditure that can be offset by rewards from the stable arm to ensure the agent is not
“in the negative,” as the agent is not allowed have negative reward at any point in time.
This corresponds to not being able to take out a loan. Thus, an agent who does not have
any “savings” coming in must play f1 before they ever play f2 . We suppose that smallest
piece of time an agent can split between the arms is 1 unit. Later, we consider what
happens when the cost of striving is subsidized by a “trust fund.”
Comfort
Now, further, let us suppose an agent always wants to have average reward at
least γ , that is, at time t , the agent wants their accrued reward to be at least γ · t . They
still aim to optimize the competitive ratio as before, except now they do so subject to the
constraint that ∀t , the reward accrued up to that point is at least γ · t .
Definition 7.3.3. We say an agent desires γ-comfort if at any time t > 0 , they require
net reward at least γ · t .
The agent playing this game aims to solve:
max
ALG
OPT
s.t.
ALGt
t
≥γ .
86
Since the agent can play an arm for fractional amounts of time, an agent who requires
γ comfort will play αγ time on the stable arm and then 1 −αγ time on the striving arm,
alternating between the two as soon as possible, for αγ := (γ + 1)/2 , the time duration
that guarantees the desired average reward:
ALGt =
(
t
t ≤αγ
2αγ −t
αγ < t ≤1
⇒
ALGt
t
=
(
1
t ≤αγ
2αγ
t
−1
αγ < t ≤1
for αγ < t ≤1 , γ = 2αγ −1 ≤2αγ
t
−1 ≤1 .
This is the most rational thing for them to do, since any additional steps on f1 simply
serve to offset future costs of f2 but might prevent the agent from seeing the increase
phase as quickly. We formalize this below and provide the proof in Appendix D.3.2 (which
proceeds via similar casework to the proof of Lemma 7.3.1).
Definition 7.3.4. We call a strategy minimally accumulating for an agent who wants to
be γ-comfortable if the average net reward at time t , ALGt/t is exactly 1 until reaching
time αγ := (γ + 1)/2 when playing the stable arm and strictly decreasing until reaching
value γ when playing the striving arm. In other words, the agent plays the stable arm for
αγ time followed by the striving arm for 1 −αγ time and repeats.
Lemma 7.3.3. For each strategy that “stockpiles” reward along the way, there exists a
minimally accumulating strategy that nets total reward at least as much as the stockpiling
strategy.
We present the result for the competitive ratio and reward for a γ-comfortable agent
(proof in Appendix D.3.3).
Lemma 7.3.4. Suppose an agent who wants to be γ-comfortable plays f1 for αγ time
followed by f2 for 1 −αγ time before reverting back to f1 and continuing the process.
Then, the agent wanting to maximize their competitive ratio subject to the constraint
of the average reward always being at least γ will switch after absolute time T −γ
2 −
1
2
p
γ2 + 4T(2 −γ), achieving competitive ratio γ + γ(1−γ)
2T
+ (1−γ)√
γ2−4T(2−γ)
2T
. This cor-
responds to 1−γ
2
·

T −γ
2 −1
2
p
γ2 + 4T(2 −γ)

time on the striving arm.
Remark 6. Let us consider a concrete numerical example: suppose T = 150 , γ = 0.5.
Then, the agent will switch after about time 135. However, of that time, only about 34
would have been spent exploring, with the remaining 101 time spent on the stable arm.
The competitive ratio achieved is 0.55.
Remark 7. For insight, let us next consider the behavior for extreme values of γ : if γ = 0 ,
the first two terms go away, and the competitive ratio is
√
2T
T
=
2
√
T . This exactly aligns
with our computation before. On the other hand, if γ →1 , the competitive ratio actually
nears 1! This is because the best possible thing to do for an agent who requires complete
comfort is to always play the stable arm. Indeed, to better understand this outcome, let
87
us also investigate the total amount of time spent exploring as a function of γ . Taking
the derivative of the expression for exploration time with respect to γ, we can see that
it is negative for all γ ∈[0, 1] . This tells us that as an agent requires more “comfort,”
they spend less time exploring on the striving arm, and so while their competitive ratio
improves, their chance of witnessing the growth in the striving arm and benefiting from it
is low.
7.4
