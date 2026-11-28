---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-066-formal-setting-improving-mab
section_title: "Formal Setting: Improving MAB"
section_number: null
pages: 96-97
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We propose studying grit in the improving multi-armed bandits framework [HKR16].
Overall, we follow the framework in Section 2.2. We detail the specific instance we study
now.
In our models for grit, it is natural to think of options having different payoffs, some of
which are static over time and some of which take a while to start paying off but then pay
off well once they do. Thus, we propose a two-armed bandit instance in which to study
gritty behavior. All of our models will include a stable arm, f1(t) = 1 ∀t that represents
an option that starts paying off immediately and consistently rewards the agent the same
amount (i.e., little scope for growth). The other arm is one in which there is no reward at
first (or in certain cases where specified, there is actually a cost to striving), after which
the arm starts providing non-negative reward. We refer to this arm as the “striving” arm,
and it provides a reward of 0 units for the first θ time steps that it is played (θ being
81
unknown to the agent1), following which it increases linearly at a slope of α (agents will
have beliefs about α). Formally, the two bandit arms are:
f1(t1) = 1 ∀t
f2(t2) =
(
0
t2 < θ
α(t2 −θ)
t2 ≥θ ,
(7.1)
where t represents the amount of time for which that arm has been played.
In most of the chapter, we use this model, though in some sections we set α = 1. Later
on, in Section 7.3.3, we also define a notion of “comfort” which places a restriction on how
often f2 can be played, requiring that f1 be played frequently enough to build up a buffer.
This choice of model is natural: the improving multi-armed bandits problem is well-
studied, and there is a clear understanding of what we could hope to achieve in the general
case [PNGK23, BR25]. The structure in the reward function allows us to capture the fact
that investing time into an option may change its payoff. Finally, the instance described
is abstract and flexible, allowing us to model a wide range of real-world settings. On the
other hand, a limitation is that this instance only allows for studying an agent’s decision
between two options. The stable option is arguably over-simplified, since stable options
can also lead to growth in the real world. Overall, however, we believe this is a good
starting point for formally modelling the decision problem of interest. Further, within the
improving two-armed bandit setting, this is the simplest model in which we see non-trivial
behavior: if the second arm’s payoff were flat instead of linear, the trivial strategy of
playing f1 all along would suffice for optimizing the competitive ratio. This is discussed
in detail in the Appendix.
7.3
