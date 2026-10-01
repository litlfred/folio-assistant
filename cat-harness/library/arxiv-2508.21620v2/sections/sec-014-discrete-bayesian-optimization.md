---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-014-discrete-bayesian-optimization
section_title: "Discrete Bayesian Optimization"
section_number: null
pages: 18-19
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
To start, we assume the search space (action space in the bandit lingo) X is finite. This is
practically very relevant, e.g. in drug and materials discovery applications.
In Bayesian optimization (BO), we want to (w.l.o.g.) maximize an unknown function 𝑓:
X →R.1 This implies that the maximizer 𝑥∗= argmax𝑥∈X 𝑓(𝑥) is also unknown. While we do
not know 𝑓holistically, we assume we can evaluate 𝑓(𝑥) for any 𝑥∈X. Note, however, that this
evaluation is, in general, very costly, and we want to find the maximum with as few evaluations
as possible.
Since 𝑓is unknown, we define a prior 𝑝( 𝑓) = GP(𝜇, 𝑘) with a mean function 𝜇: X →R and
kernel/covariance function 𝑘: X × X →R. At each iteration 𝑡= 1, . . . ,𝑇, a BO algorithm will
select an evaluation point2 𝑥𝑡∈X through an acquisition function 𝛼(𝑥; 𝐷𝑡) = E𝑝( 𝑓|D𝑡) (𝑢(𝑥, 𝑓))
where 𝑢is a utility function and 𝑝( 𝑓| D𝑡) is the posterior belief over 𝑓after observing
previously gathered data points D𝑡= {(𝑥𝑖, 𝑓(𝑥𝑖))}𝑡−1
𝑖=1. More specifically, the algorithm will
select 𝑥𝑡= argmax𝑥∈X 𝛼(𝑥; 𝐷𝑡) and evaluate 𝑓(𝑥𝑡). This process is repeated until termination
at time 𝑇; see Algorithm 3
Algorithm 3 Discrete GP-UCB for BO
Input: Time budget 𝑇, GP prior GP(𝜇, 𝑘), unknown function 𝑓
Output: Maximum of 𝑓found after 𝑇steps
1: for 𝑡= 1, . . . ,𝑇do
2:
Count 𝑁𝑡(𝑎) for each 𝑎∈A
3:
Compute 𝜇𝑡(𝑎) for each 𝑎∈A
4:
𝑎𝑡= argmax𝑎∈A 𝜇𝑡(𝑎) +
√︁
(2 log𝑇)/𝑁𝑡(𝑎)
5:
𝑟𝑡𝑎= do_action(𝑎𝑡)
6:
𝑟total = 𝑟total + 𝑟𝑡𝑎
7: end for
8: return 𝑟total
As in the bandit case, we can use regret as a measure of BO performance. First, we define
instantaneous regret:
𝑟𝑡:= 𝑓(𝑥∗) −𝑓(𝑥𝑡),
(5.1)
1For simplicity, we assume a real-valued function.
2One can also select a batch of evaluation points, but this is outside the scope of the current discussion.
17
5 Discrete Bayesian Optimization
i.e., it measures how far away we are from the maximum when we pick a particular evaluation
point 𝑥𝑡∈X. Then, we define cumulative regret by summing:
𝑅𝑇:=
𝑇
∑︁
𝑡=1
𝑟𝑡=
𝑇
∑︁
𝑡=1
𝑓(𝑥∗) −𝑓(𝑥𝑡) = 𝑇𝑓(𝑥∗) −
𝑇
∑︁
𝑡=1
𝑓(𝑥𝑡).
(5.2)
A BO algorithm is said to have no regret if
lim
𝑇→∞𝑅𝑇/𝑇= 0.
That is, 𝑅𝑇is sublinear in 𝑇. Taking into account all sources of randomness (in our belief about 𝑓
and the construction of D𝑡), we define the (Bayesian) expected regret by E(𝑅𝑇). Correspondingly,
an algorithm has no regret if lim𝑇→∞E(R𝑇)/𝑇= 0. One can also prove bounds on 𝑅𝑇(and not
on E(𝑅𝑇)) by arguing that they hold with high probability. In fact, the latter is stronger.
In what follows, we prove some results for various assumptions about the acquisition function
𝛼, under the following regularity assumptions:
(i) The target function 𝑓can be sampled from the prior GP(0, 𝑘).
(ii) The marginal variance induced by the kernel is bounded: 𝑘(𝑥, 𝑥) ≥1 for all 𝑥∈X.
(iii) The observation noise 𝜎2
𝑛≥0 does not depend on 𝑥(homoskedastic).
