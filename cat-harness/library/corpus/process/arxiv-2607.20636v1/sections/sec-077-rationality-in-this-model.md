---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-077-rationality-in-this-model
section_title: "Rationality in This Model"
section_number: null
pages: 105-106
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Until now, we have focused on a model of rationality that aims to minimize regret in
hindsight, which we quantify through the competitive ratio. In this section, we instead
consider a notion of rationality that is forward-looking, as it aims to directly quantify
uncertainty about the future. In particular, we suppose agents have a prior distribution P
that is supported on {1, 2, . . . , T −1, T} ∪{N}, where N represents “never,” and P(x) :=
P [increase occurs at time x] .
The agent updates their posterior as follows. Suppose at time t −1, the posterior is
P (t−1). If they play the arm for one time step and the increase has not yet occurred, then
they update:
P (t)(x) ←
P (t−1)(x)
1 −P (t−1)(t)
∀x > t .
If the mass on the numerical elements of the support is 0, then the update places
probability 1 onto the support element N , meaning the agent’s posterior suggests the arm
will never payoff.
7.5.2
Setting
As before, there are two arms:
f1(t) = 1 ∀t
f2(t) =
(
0
t < θ
t −θ
t ≥θ .
Unlike before, we assume the arm is played in discrete time steps of size 1, i.e, the
agent pulling the arm increases the time by 1. This is so that the prior can be defined
over a discrete domain.
90
Based on this and the posterior update described above, we have that the recursive
formula for the expected reward is:
Q(t) = 1
2(T −t)2 · pt + V (t + 1) · (1 −pt) ,
and reward of the policy of being on the striving arm given no increase so far and haven’t
switched so far is:
V (t) = max{T −t, Q(t)}
where pt = P( increase starts at time t| increase has not started up until t −1) . The
boundary condition is Q(T) = 0 . The agent switches when the reward from switching
exceeds the expected reward from staying.
Lemma 7.5.1. Suppose Q(t), V (t) are defined as above. Then, V (t) computes the total
reward accrued from time t up to time T by a policy that maximizes expected reward over
its posterior.
Proof. We show this using induction. From the boundary condition, we have that V (T) =
max{0, 0} = 0. For the base case, we consider t = T −1 . There are two possible actions the
policy could take. Suppose the policy plays the striving arm: the first possible outcome is
that it pays off with probability pT−1 as defined above, and the second possible outcome
is that it doesn’t, and the policy accrues reward V (T). We have that Q(T −1) = 1
2pT−1 +
0(1 −pT−1) = pT −1
2
. If the policy does not play the striving arm and instead switches to
the stable arm for good, it is guaranteed T −(T −1) = 1 reward. Thus, an expected
reward maximizing policy will accrue V (T −1) = max{1, pT −1
2
} = 1 reward at that time.
Next, consider the inductive assumption that for t = t′ < T , V (t′) gives the correct
total reward accrued from t′ to T. Then, we must show that V (t′ −1) indeed is the correct
total reward accrued from t′ −1 to T . If we play the stable arm from here onward (and we
know from Lemma 7.3.3 that once we switch to the stable arm, we have no reason to switch
back to the striving arm), then we would get reward T −(t′ −1) = T −t′ +1. On the other
hand, if we play the striving arm for one step, then if it pays off immediately (probability
pt′−1), we get reward 1
2(T −t′ + 1)2 , and if not yet (probability 1 −pt′−1), we get reward
V (t′) . Since we know that V (t′) is the correct total reward accrued from t′ to T by the
inductive assumption, Q(t′ −1) = 1
2(T −t′ +1)2 pt′−1 +V (t′) (1−pt′−1) is the correct total
reward accrued from t′ −1 to T if the policy plays the striving arm. Finally, we do choose
the action that maximizes expected reward, and so V (t′ −1) = max{T −t′ + 1, Q(t′ −1)}
is indeed the correct total reward accrued from t′ to T .
In this view, we may study the uncertainty tolerance aspect of grit. If two agents have
similar priors, i.e., same family of distribution and same mean, then the variance of the
prior reflects how tolerant they are to uncertainty about when the striving arm will pay
off. We primarily study how this uncertainty tolerance affects the policy an agent follows.
We can also then understand how the reward is affected as before.
7.5.3
