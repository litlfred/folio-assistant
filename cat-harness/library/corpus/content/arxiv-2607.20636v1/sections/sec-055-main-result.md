---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-055-main-result
section_title: "Main Result"
section_number: null
pages: 87-89
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this section, we show that the random process described in Definition 6.4.2 applied to
the setting described in Definition 6.4.1 for a reasonable amount of time shifts groups into
correct cascades with high probability.
Theorem 6.4.1. Suppose the government provides the subsidy detailed in Definition 6.4.2
for the game in Definition 6.4.1. That is, at each time step t > 0 , the government (without
knowledge of the group of the current agent or the history) draws a subsidy at random
rt ∼D , where the probability of any element in the support of D is at least pmin . Then,
for all δ > 0, after
2 k
gmin

2 log(3k/δ−1)
log(p/(1−p))
pmin (2p−1) +
2 log(3k/δ)
p2
min(2p−1)2 + log(3k/δ)

steps, with probability at
least 1 −δ , all k groups will end up in what is for them an up-cascade.
Proof Sketch At a high level, the proof proceeds as follows: (1) We fix a group
and show that the subsidy behaves, as before, as a random walk that group takes on the
72
number line. (2) We show how long it takes to achieve with high probability a sufficient
condition for the walk to finish in a cascade on the correct action. (3) We union bound
over the failure probability and appropriately scale the time required to achieve the stated
result.
(1) Let us first describe a random walk Rgvt that models the setting in Definition 6.4.1
with the government subsidy described in Definition 6.4.2. See the appendix for a proof.
Next, we define a related but simpler random walk, R. In both cases, the reverse walk
describes the same for a group for whom the correct direction is the left.
Lemma 6.4.2. The following random walk, which we shall call Rgvt , describes the walk
taken by a group for whom the correct action is to the right when the government pro-
vides the subsidy described in Definition 6.4.2:
Pi to i−1 [=] αi · (1 −p) ; Pi to i [=] 1 −
αi ; Pi to i+1 [=] αi · p , where αi := Pgvt choice [signal is revealed in this state] .
Definition 6.4.3. Let us call the random walk with the following transition probabilities
R: Pi to i−1 [=] pmin · (1 −p) ; Pi to i [=] 1 −pmin ; Pi to i+1 [=] pmin · p .
We can show that we can analyze R instead of Rgvt (details in full version).
(2) Next, we consider three modes of failure: first, if there are not sufficiently many
signals aligned to the correct direction, the majority vote will not align with the correct
action for the group; second, since the government only encourages signal-revealing but
does not behave differently depending on which action is correct for a group, we may
accidentally hit a bad cascade before hitting a good one just due to a bad ordering in
the sequence of signals; third, we may not see enough people from this group to take
sufficiently many steps on the random walk. We reason formally about each of these,
computing first a number of steps after which with probability 1 −δ/(3k) the walk is
sufficiently far to one side and then arguing that the side to which the walk is shifted is
the correct one for that group with probability 1−δ/(3k). Finally, we apply the Hoeffding
bound with failure probability δ/(3k) to ensure we see sufficiently many people. With
that, the analysis is complete for a single fixed group.
(3) Finally, we union bound over the failure probability so that the result holds and
report after how long of the government providing such a subsidy, with high probability all
groups stabilize to optimism cascades. Detailed proofs for this theorem and its constituent
lemmas are in the appendix of the full version.
□
Remark 5. For sake of generality, we present the result in Theorem 6.4.1 in terms of
pmin , and gmin . However, let us plug these in and discuss the scaling for intuition. First,
the support of the distribution D has size at most 2L, so pmin ≤1/(2L) ≤1/(2 log(1/δ0−1)
log(p/(1−p))) .
Plugging this in, upper bounding, and ignoring constants, we get that the number of total
required steps scales like k L2
gmin · log(3k/δ)
(p−1
2)
2 , where L = log(3k/δ−1)
log(p/(1−p)) . We can see that the number
of steps scales like 1/(p −1/2)2 , implying that the closer the signal strength to 1/2 , the
longer it takes to drift far enough in the walk. This is standard for problems where we must
distinguish whether a “coin flip” has bias 1/2 + ϵ or 1/2 −ϵ . Next, we see the standard
dependence on the failure probability, log(1/δ) , and union bound, log 3k . Finally, we see
the inverse dependence on gmin , meaning that the lower the minimum probability of seeing
a group, the longer this subsidy needs to be in place. Now, if the probability of an agent
belonging to a group is uniform across the k groups, then gmin = 1/k , and so the scaling is
73
like L2 k2 · log(3k/δ)
(p−1
2)
2 . From this, we can see that the dominant dependence of this bound on
the number of groups is through the prevalence of the lowest-prevalence group and making
sure each group takes sufficiently many steps.
6.5
