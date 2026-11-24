---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-010-external-and-policy-regret-adversary-model
section_title: "External and Policy Regret, Adversary Model"
section_number: null
pages: 25-27
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Let us start by discussing the adversary model and how we are running and evaluating
our algorithm. We consider oblivious adversaries and evaluate our algorithm in a policy-
10
competitive rather than externally-competitive way1.
In this section, we flesh out the
adversary, comparator, and competitive ratio that we study.
The adversary model in our work is that of an oblivious adversary. Since we study
randomized algorithms, we could consider either adversaries that know the strategy but
not the exact instantiation of randomness (oblivious adversaries) or adversaries that know
both the strategy and the instantiation of randomness (adaptive adversaries). Once we
give the adversary access to the instantiation of randomness, there is very little we can do
to outperform it [BDBK+94], and so we restrict our attention to oblivious adversaries.
We now describe the pattern of interaction in our setting involving randomized algo-
rithms. First, the algorithm is defined. The pseudocode for the algorithm is published,
but the specific randomization is kept private. Next, the adversary starts by simulating
a run of the algorithm, keeping in mind that there will eventually be randomness. The
adversary picks rewards (in our case, functions to assign to the arms) based on this simu-
lation. Once the adversary has picked all the rewards, the game can begin. The algorithm
makes its first move, outputting some action x1 and the adversary responds with a reward
function r1(·) ∈R . (In the improving multi-armed bandits case, x1 is the identity of the
first arm pulled, and r1(x1) is fx1(1) .) This continues for T time steps.
Now, let us consider the comparator. We can think of the comparator as what kind
of optimal strategy we use to evaluate an adversary’s choices. The standard comparator
in much of online learning, including in the very first chapter of [Haz23] is the best single
action in hindsight.
In this case, the comparator reward is accrued as follows.
Once
the interaction is complete, we consider all the reward functions {rt(·)}T
t=1 . We pick the
x that maximizes the sum of the known reward functions over all time. Formally, the
accumulated rewards of the algorithm and the comparator are defined below, where the
rts are chosen to be worst case:
reward of comparator : max
x∈X
T
X
t=1
rt(x)
(2.1)
reward of algorithm :
T
X
t=1
rt(xA
t )
(2.2)
Typically, in online learning, we study external regret, which quantifies the difference
between the reward of the algorithm and the comparator, as defined below, following
[Haz23]:
RT (A) :=
sup
{rt}T
t=1∈RT
(
max
x∈X
T
X
t=1
rt(x) −
T
X
t=1
rt(xA
t )
)
.
(2.3)
While this can be a reasonable thing to study in general settings, in the improving multi-
armed bandits setting, this comparator is not very sensible. Consider a setting in which
we are attempting to select hyperparameters that will perform well when we train to
1In the literature, it is standard to discuss external regret and policy regret, which are different measures
of regret. We use the same comparators as in that framework but take the ratio of the algorithm’s reward
with the comparators reward rather than the difference.
11
convergence.
The comparator in external regret asks which single hyperparameter, if
chosen, would maximize the witnessed training accuracy. However, when we deploy the
hyperparameter setting, we are not going to train it for only the number of steps for which
we ran it in the selection phase; we will train it to convergence. Then, the sequence of
rewards will result in a much higher final reward, and in fact the chosen arm might not be
the best arm after all. To address this, we define an alternate comparator, the one that
appears in policy regret.
Now, instead of considering a comparator that receives the set of reward functions rt(·)
and chooses the best x , suppose the comparator can actually interact with the adversary.
The comparator sets its algorithm, and, as described above, the adversary chooses a set
of reward functions r⋆
t (·) according to the comparator algorithm. Then, we measure how
well this comparator algorithm does. Now, we pick the algorithm that maximizes its own
reward under this procedure, and the reward of that algorithm, A⋆that is the value we
to which compare. Formally:
reward of comparator :
T
X
t=1
r⋆
t (xA⋆
t )
(2.4)
reward of algorithm :
T
X
t=1
rt(xA
t )
(2.5)
The regret metric associated with this comparator, policy regret is defined as follows:
RT (A) :=
sup
{r⋆
t }T
t=1∈RT
T
X
t=1
r⋆
t (xA⋆
t ) −
inf
{rt}T
t=1∈RT
T
X
t=1
rt(xA
t ) .
(2.6)
Now, we reproduce Example 1 from [HKR16] to illustrate the difference between ex-
ternal and policy regret in improving multi-armed bandits.
Example 1. (Example 1 in [HKR16]) Consider a setting in which there are two arms
and time horizon T >> 10. Arm 1 returns a reward of i/T when pulled for the ith time,
and arm 2 always returns a reward of 0.1. Consider the algorithm that always pulls arm
2. The external regret of this algorithm is zero because at every time step, it pulls the
arm that would give it the largest reward on that time step. But the policy regret of this
algorithm grows linearly with T, as the best policy in hindsight indeed pulls arm 1 at every
time step.
Thus, we can see that policy regret is a stronger notion of regret than external regret.
In general, we will thus use the comparator arising from an optimal policy (algorithm)
rather than the best fixed action in hindsight.
2.2.2
