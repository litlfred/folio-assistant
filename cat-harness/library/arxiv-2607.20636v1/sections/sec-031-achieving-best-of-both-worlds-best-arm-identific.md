---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-031-achieving-best-of-both-worlds-best-arm-identific
section_title: "Achieving Best-of-both-worlds Best Arm Identification"
section_number: null
pages: 53-55
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this section, we bridge a gap in the literature: so far, algorithms can either identify the
best arm in an instance that is sufficiently benign or identify an approximate best arm but
not both, i.e., identify the best arm if possible and achieve the approximate goal if the ex-
act goal cannot be achieved. To this end, we introduce a family of hybrid algorithms that
address the task of identifying the arm with the highest final reward, the best arm iden-
tification (BAI) task3. Each algorithm in this family guarantees best arm identification
whenever an instance is sufficiently benign, while simultaneously achieving optimal (up
to constants) multiplicative guarantees on worst-case instances. We first provide exam-
ples that show that no existing algorithm achieves near-optimal results on both nice and
worst-case instances. We define our family in Section 4.4.1. In Section 4.4.2, we formalize
a ‘niceness’ condition under which it is possible to sample every suboptimal arm enough
to safely discard it by the switch time. We then prove that Hybrid1,T/2 is guaranteed to
identify the best arm on instances that satisfy this condition and, on all other instances, re-
turns an arm whose expected maximum pull at time T competes optimally with the highest
3While the reader may be more familiar with BAI in the sense of maximum mean in stochastic bandits,
we note that in that case, we could equivalently study cumulative reward from a single arm.
38
number of arm pulls
reward
optimal arm i∗
1
T
T/2
1
2
all other arms
(a) [BR25] may be suboptimal by a factor of
two on some “nice” instances
number of arm pulls
reward
optimal arm i∗
1
T
T/k
1
k
all other arms
(b) [MMT+24] may be suboptimal by a factor of
√
k on worst-case instances
Figure 4.6: Examples demonstrating the need for a best-of-both-worlds approach.
single pull in the instance. We also develop results for choosing α, B in a data-driven way.
Motivating Examples. Prior work gives two distinct types of guarantees for improv-
ing bandits—optimal approximation factors for worst-case instances [PNGK23, BR25],
and better guarantees (sublinear policy regret, or small sample complexity of best arm
identification) for nicer instances [HKR16, MTPR22, MMT+24].
It is natural to ask
whether we can achieve the best-of-both-worlds, that is, get almost optimal results on
nice instances, while being within the optimal approximation factors (up to constants) in
the worst-case. It turns out that the algorithms proposed in prior literature fail to achieve
such a guarantee.
The following example shows that the algorithm of [BR25] has sub-optimal guarantees
on nice instances.
Example 3. The randomized algorithm of [BR25] may fail to identify the best-arm on
instances where the UCB-style algorithms of [MTPR22, MMT+24] find the best-arm. We
set the reward function for the best arm as fi∗(t) = 1 for all t, and for any other arm
i̸ = i∗as fi(t) = min{ t
T , 1
2}, where T is the time horizon. We assume that k is large
(in particular, k ≥4). Now, the randomized round-robin algorithm selects the optimal
arm as its first or second arm with probability at most 2/k. Otherwise, it keeps playing
a sub-optimal arm till time T/2, and a different sub-optimal arm for the rest of the time
horizon. Thus, with probability at least 1 −2
k, the best arm identified by the algorithm is
sub-optimal by at least a factor of 2 (with respect to both its cumulative reward and its final
pull). On the other hand, for the UCB-based algorithms, we can upper bound the number
of exploratory pulls of the sub-optimal arms, and the algorithm succeeds in identifying the
best arm i∗.
The following example shows that the UCB-variant (R-UCBE) developed for the improving
bandits BAI problem by [MMT+24] has sub-optimal worst-case performance.
Example 4. The UCB-based algorithm of
[MMT+24] for best-arm identification may
output an arm with Ω(k) sub-optimal reward compared to the actual best arm on some
39
instances.
We adapt the example used by [BR25] in their lower bound construction.
Set fi∗(t) = t/T for all t for the optimal arm i∗, and for any other arm i̸ = i∗as
fi(t) = min
 t
T , 1
k
	
. Due to the exploration term in UCB, while the arm rewards are iden-
tical, each arm gets pulled an equal number of times. By time T, each arm gets pulled T/k
times, and all the arms appear identical to the algorithm. Thus, the best arm learned by
the algorithm may be sub-optimal (with respect to both its cumulative reward and its final
pull) by a factor of Ω(k). In contrast, the PTRR algorithm family guarantees a worst-case
competitive ratio of O(
√
k) or smaller.
4.4.1
