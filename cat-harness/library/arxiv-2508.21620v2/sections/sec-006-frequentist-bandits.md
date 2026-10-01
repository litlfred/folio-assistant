---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-006-frequentist-bandits
section_title: "Frequentist Bandits"
section_number: null
pages: 10-10
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
In 𝐾-armed bandit problem, we have 𝐾different actions 𝑎𝑡∈A := {1, . . . , 𝐾} we can perform
at each time step 𝑡= 1, . . . ,𝑇. After performing an action 𝑎∈A, the we observe a reward value
𝑟(𝑎) ∈[0, 1] distributed as an unknown reward distribution 𝑝(𝑟| 𝑎).
Let 𝜇(𝑎) = E(𝑟(𝑎)) be the unknown expected reward of action 𝑎.
Let us also denote
𝑎∗= argmax𝑎∈A 𝜇(𝑎) to be the action with the highest expected reward. We can define
𝑅𝑇=
𝑇
∑︁
𝑡=1
𝑟(𝑎∗) −𝑟(𝑎𝑡),
(3.1)
called the regret over a run of an algorithm where we select a sequence of actions (𝑎𝑡)𝑇
𝑡=1. This
measures “how far away” our actions deviate from the optimal actions.
Since each 𝑎𝑡in (3.1) is a random variable that depends on an algorithm’s run, 𝑅𝑇is also a
r.v. Thus, it makes sense to study the expected regret
E(𝑅𝑇) =
𝑇
∑︁
𝑡=1
𝜇(𝑎∗) −𝜇(𝑎𝑡) = 𝑇𝜇(𝑎∗) −
𝑇
∑︁
𝑡=1
𝜇(𝑎𝑡).
(3.2)
Ideally, an algorithm has no regret, i.e., lim𝑇→∞E(𝑅𝑇)/𝑇= 0. Our goal is to construct an
algorithm for picking sequences of actions that minimize the expected regret and asymptotically
have no regret. The algorithm shall leverage frequentist technique, e.g. using the sample mean
to estimate 𝜇and making a decision based on this estimate.
