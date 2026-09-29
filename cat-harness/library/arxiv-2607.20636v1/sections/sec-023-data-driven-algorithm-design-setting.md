---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-023-data-driven-algorithm-design-setting
section_title: "Data-Driven Algorithm Design Setting"
section_number: null
pages: 42-44
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
As before, we have an algorithm playing against an adversary. The role of the adversary
is to pick the instance on which the algorithm must perform, and the algorithm’s goal is
to solve some optimization problem on that instance. In contrast to the previous chapter,
we now will study a situation where the adversary can only define a distribution over
instances. Then, a neutral party chooses the specific instance randomly, and the goal of
the algorithm will be to do well on average over instances drawn from the distribution.
Thus, if the algorithm A ∈A (the class of all randomized algorithms) is solving an
optimization problem with (maximization) objective V on instance I ∼D over domain
I , the goal of the algorithm designer is to design the algorithm that solves the following
expected objective:
max
A∈A EI∼DV(A(I))
(4.1)
27
Note that if we can get guarantees that hold for any distribution, then that guarantee
must, in particular, hold for the worst distribution the adversary could pick.
In the improving multi-armed bandits setting, an instance comprises a set of k arms,
each of which has an increasing reward function. Thus, when we talk about a distribution
over instances, we are considering distributions that are supported on I, the space of all k
tuples of arms. (Note that this is richer than assuming a distribution over arms and then
taking its product k times to get a product distribution over instances.)
In the previous chapter, we developed nearly-tight approximation guarantees for this
problem. Work on the problem has typically assumed that the reward functions are con-
cave (i.e., satisfy diminishing returns), and lower bounds involve at least some arms that
have minimally concave (i.e., linear) reward functions. However, in many practical set-
tings, we would expect the reward functions to not only be concave but also satisfy some
stronger condition on the growth rate. In this chapter, we study the problem of designing
algorithms for the improving bandits problem that achieve stronger performance guaran-
tees on more benign problem instances. In particular, we design families of algorithms
parameterized by some parameter(s) α , and we wish to learn the “best” algorithms from
this family.
Consider the example of tuning hyperparameters such as learning rates for neural net-
works. Here each bandit arm corresponds to a value of the hyperparameter, an arm pull
corresponds to running an additional training epoch for the corresponding value of the
hyperparameter, and the reward function corresponds to the learning curves that cap-
ture the training accuracy as a function of the epochs (for the different hyperparameter
values). Often the number of arms is very large (e.g. a grid of multi-dimensional hyper-
parameters), so existing approximation factors may be too pessimistic here. Furthermore,
in many practical settings, we have access to historical data consisting of learning curves
for training similar models on related tasks or datasets (similarly, we may have access
to past clinical records, or data regarding click-through-rates for online advertising and
recommendation). We can use these related previously-seen tasks to design our algorithm
for the current instance. Formally, we assume we have access to multiple IMAB instances
drawn from an unknown distribution. We seek to perform as well as the best parameter
α in the defined algorithm family, on average over the distribution.
In order to do this, we first develop stronger approximation guarantees that depend
on the strength of concavity of the reward functions. Our guarantees are achieved by a
family of algorithms, parameterized by a parameter α that corresponds to the strength of
concavity. We show that by setting α appropriately, we achieve the optimal approximation
guarantees for every strength of concavity. In other words, if we know how “nice” our
improving bandits instance is, we can use the appropriate algorithm from our family. On
the other hand, if we do not have this information, we resort to a data-driven approach
to learn the best algorithm parameter from the data. We obtain bounds on the sample
complexity, that is, the number of IMAB instances sampled from the distribution that
suffice to learn the best algorithm.
Next, we turn our attention to the best-arm identification (BAI) task. Approaches
from prior work either guarantee that the best arm is exactly recovered on a sufficiently
“nice” instance (using a notion of niceness that is different from the strength of concav-
ity [MMT+24]), or select an arm such that the reward of the selected arm is a good
approximation to the reward of the best arm on any (worst-case) instance [BR25]. How-
28
ever, the former may suffer from sub-optimal approximation ratios on more challenging
instances, while the latter may fail to recover the exact best arm on the nicer instances.
We propose a hybrid algorithm which resolves this gap in the literature and obtains a
best-of-both-worlds guarantee.
That is, on a nice instance, our algorithm will recover
the best arm, while still guaranteeing the optimal approximation factor (up to constants)
on the worst-case instance. We further show how to tune the parameters of our hybrid
algorithm to obtain the near-optimal parameters on typical instances for a fixed problem
domain, by giving bounds on the sample complexity of data-driven algorithm design.
4.1.1
