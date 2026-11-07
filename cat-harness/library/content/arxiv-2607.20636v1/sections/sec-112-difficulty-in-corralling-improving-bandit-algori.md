---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-112-difficulty-in-corralling-improving-bandit-algori
section_title: "Difficulty in Corralling Improving Bandit Algorithms"
section_number: null
pages: 154-157
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
A natural approach towards obtaining best-of-both-worlds guarantees in the above exam-
ples would be to design a meta-algorithm that can potentially switch between [BR25] and
[MMT+24]. We examine whether it is possible in the improving bandits setting to perform
corralling [ALNS17, AMM21, LZZZ22], a recently developed paradigm for meta-learning
bandit algorithms in a fully online setting. Our main result here is an impossibility result
which rules out the ability to use corralling to achieve best-of-both-worlds in a fully online
improving bandits setting. We show that in the improving bandits setting, no matter what
the meta-algorithm is, it is possible to suffer linear regret relative to best base algorithm.
In the meta-learning setting, we have a collection of M base algorithms B = {B1, . . . , BM}
for the IMAB problem and the goal is to (nearly) recover the guarantees of the best algo-
rithm on any given instance. Each base algorithm can give its own prediction for which
arm to play next, given the history of arm pull and rewards so far and the meta-learner can
decide which arm to actually pull based on these predictions. For best arm identification,
we define the sub-optimality ratio of the meta-algorithm as
RT (M, µ, B) :=

max
j
RBj
T (µ)

/RM
T (µ),
where µ denotes the IMAB instance, RBj
T
denotes the cumulative reward of the best arm
selected by base algorithm Bj, and RM
T
denotes the cumulative reward of the best arm
selected by the corralling meta-algorithm M.
Theorem B.5.1 (Lower Bound for Best Arm Identification in Corralling Improving
Bandits). Consider deterministic multi-arm rested bandits with rising concave reward se-
quences. Let B = {B1, . . . , BM} be any finite class of (possibly randomized) base algo-
rithms. A meta-algorithm M selects at each round one base algorithm whose recommended
arm is executed. Then
inf
M sup
µ,B
RT (M, µ, B) ≥2.
Proof. Let k = 3. Fix horizon T and let L = T/2. Choose ∆> 0 sufficiently small.
Construct three deterministic concave rising environments Ej as follows.
139
For s ≤L, define
µ1(s) = µ2(s) = µ3(s) = s∆.
That is, the first L pulls of each arm yield identical rewards in all environments.
For s > L, define:
Environment Ej:
µj(s) = L∆+ (s −L)∆,
µi(s) = L∆, for i̸ = j.
All reward sequences are nondecreasing and concave. Observe that the environments
are identical until some arm is pulled more than L times. In Ej, arm j is uniquely optimal
after the divergence. Set the base algorithm class B = {B1, B2, B3}, where Bj always pulls
arm j and outputs it as the best arm.
Consider any meta-algorithm M. Note that the meta-algorithm can pull at most one
base algorithm more than L times, say B1 (WLOG). Since rewards are identical for the
first L pulls of each arm, M cannot distinguish between environments E2 and E3. So,
no matter what best arm is selected by M, we can always select an environment where
it picks a sub-optimal arm. In any environment the optimal arm gets cumulative reward
twice as much as any sub-optimal arm. Therefore,
sup
µ∈{Ej}
RT (M, µ, B) ≥2.
For cumulative reward maximization, we seek to bound the meta-regret with respect to
the best algorithm among the base algorithms
˜RT (M, µ, B) := max
j
RBj
T (µ) −RM
T (µ),
where µ denotes the IMAB instance, RBj
T
denotes the cumulative reward if algorithm Bj
is used exclusively to decide the arm pulls for T rounds, and RM
T
denotes the cumulative
reward collected by the corralling meta-algorithm M.
Theorem B.5.2 (Minimax Impossibility of Corralling Improving Bandits). Consider de-
terministic two-arm rested bandits with rising concave reward sequences and horizon T.
Let B = {B1, . . . , BM} be any finite class of (possibly randomized) base algorithms. A
meta-algorithm M selects at each round one base algorithm whose recommended arm is
executed. Then there exists a universal constant c > 0 such that
inf
M sup
µ,B
˜RT (M, µ, B) ≥cT.
Proof Sketch. We construct two environments that are identical for the first T/2 pulls
of each arm but diverge thereafter, with opposite optimal arms.
Any meta-algorithm
attempting to compete with the best run-alone base must effectively determine which
environment it faces before the divergence point. However, since the two instances are
140
indistinguishable during the prefix, identifying the correct environment requires linear
exploration. Consequently, linear meta-regret is unavoidable on at least one of the two
instances. A full proof is located in Appendix B.5.2.
This theorem establishes a minimax barrier for corralling in improving bandits.
The
obstruction is information-theoretic: the two environments are indistinguishable for a
linear prefix yet demand opposite commitments thereafter. This motivates the need to
consider alternative approaches towards achieving best-of-both-worlds guarantees.
We provide below a complete proof for Theorem B.5.2.
Proof. Fix horizon T and let L = T/2. Choose ∆> 0 sufficiently small. Construct two
deterministic concave rising environments E+ and E−as follows.
For s ≤L, define
µ1(s) = µ2(s) = s∆.
That is, the first L pulls of either arm yield identical rewards in both environments.
For s > L, define:
Environment E+:
µ1(s) = L∆,
µ2(s) = L∆+ (s −L)∆.
Environment E−:
µ2(s) = L∆,
µ1(s) = L∆+ (s −L)∆.
Both reward sequences are nondecreasing and concave. Observe that the two environ-
ments are identical until some arm is pulled more than L times. In E+, arm 2 is uniquely
optimal after the divergence; in E−, arm 1 is uniquely optimal. Set the base algorithm
class B = {B1, B2}, where Bj always pulls arm j.
Consider any meta-algorithm M. Since rewards are identical for the first L pulls of
each arm, the distribution over the first L actions of M is identical under E+ and E−.
Let N1 be the expected number of pulls of arm 1 by round L. Without loss of generality,
suppose N1 ≤L/2 (otherwise swap the roles of the arms).
Consider environment E−, where arm 1 becomes uniquely optimal after the diver-
gence. Let j∗be an index maximizing RBj
T (E−). Base algorithm B1 must obtain Θ(T∆)
additional reward by exploiting arm 1 after round L.
Because M allocates at most L/2 pulls to arm 1 during the prefix, it under-invests
in the arm that later becomes uniquely optimal. Due to concavity, the cumulative post-
divergence reward is linear in the number of additional pulls. Thus, there exists a constant
c > 0 such that
RB1
T (E−) −RM
T (E−) ≥cT.
If instead N1 > L/2, the same argument applied to E+ yields an identical bound.
Therefore,
sup
µ∈{E+,E−}
˜RT (M, µ, B) ≥cT.
141
B.5.3
