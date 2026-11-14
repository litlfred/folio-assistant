---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-024-our-contributions
section_title: "Our Contributions"
section_number: null
pages: 44-45
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
1. We introduce a parameter β to measure the “strength” of concavity of reward func-
tions and develop algorithms with optimal approximation ratios for each β (Sec-
tions 4.3.1 and 4.3.2). For parameter β ∈(0, 1], we show that the optimal approxi-
mation ratio is O(kβ/(1+β)), which gives an improvement over the worst-case optimal
bounds of O(
√
k) from prior work whenever β < 1.
2. Our algorithms that achieve the optimal guarantees constitute a parameterized fam-
ily. In Section 4.3.3, we show how to tune the algorithm parameter, given access to
similar instances drawn from a fixed but unknown distribution over IMAB instances.
We employ techniques from data-driven algorithm design to bound the sample com-
plexity of configuring our algorithm given reward curves of “training” instances. As
in typical data-driven algorithm design settings, our results are optimal on aver-
age over the distribution. However, we can additionally reason about instances on
which we can get strong per-instance guarantees due to the relationship between our
algorithm family and sufficient conditions for stronger guarantees.
Our approach of designing a parameterized family of assumptions (that includes
worst-case instances for a fixed value of the parameter) and a corresponding tunable
family of algorithms that give optimal algorithms for each value of the assumption
parameter is novel in the context of data-driven algorithm design, and may be useful
to design algorithms with powerful expected-case as well as per-instance worst-case
guarantees in the context of other algorithm design problems.
3. In Section 4.4, we study best-arm identification (BAI) for improving bandits. Pre-
vious literature has a gap for this problem.
Namely, there are algorithms that
achieve exact BAI on certain “nice” instances but with sub-optimal worst-case per-
formance [MMT+24], and the algorithms that achieve the near-optimal worst-case
approximation [BR25] fail to identify the best arm on these easier instances.
In
Sections 4.4.1 and 4.4.2, we propose a hybrid approach that switches between an
algorithm that explores many arms and our parameterized algorithm family above
and obtains best-of-both-worlds guarantees. We also bound the sample complex-
ity of simultaneously tuning the switching time of our hybrid approach and the
concavity-strength parameter.
Related Work.
We improve the tight worst-case bounds on ˜Θ(
√
k) on the com-
petitive ratio of IMAB by exploiting the strength of concavity of instances. Prior work
[MTPR22, MMT+24] also gives regret bounds for more benign IMAB instances, and we
29
(Parametrized)
Family of 
algorithms
Receive iid instances offline, find best parameter p
1
Run Algp on new instance online
2
~ D ,
Figure 4.1: This figure summarizes the framework studied in this chapter. In phase 1
(left), the learning algorithm receives instances sampled iid from some distribution. It
uses its offline access to these instances to select the best algorithm from a parameterized
family of algorithms. This algorithm is the version with parameter p . In the phase 2
(right), the algorithm with the value of the parameter set to p is run online on a new
instance. Thus, we can see why we call this framework “offline-to-online transfer.”
discuss their notions of benign-ness in Chapter 2. We develop algorithms that achieve a
best-of-both-worlds guarantee by simultaneously achieving low regret on benign instances
and asymptotically optimal competitive ratios on worst-case instances. We also extend
techniques from the data-driven algorithm design framework [Bal20, SS25] to the IMAB
setting to bound the sample complexity to tuning the parameters in our algorithms. See
Appendix B.1 for a more detailed discussion on the related prior literature.
4.2
