---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-008-improving-multi-armed-bandit-setting
section_title: "Improving Multi-Armed Bandit Setting"
section_number: null
pages: 24-25
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Extensive scholarly attention has been devoted to problems where an agent interacting
with the world receives some reward that allows them to calibrate their future actions.
Often, we are interested in the bandit reward setting, where the agent receives reward for
a particular action taken while in the state in which they find themselves. The structure
of this reward affects the achievable performance and algorithms that achieve them.
In the improving multi-armed bandits problem, a problem instance consists of k bandit
arms (i.e., “pulling” the arm reveals the reward) each with reward that increases the
more the arm is pulled.
In other words, the payoff is not a function of the time at
which an arm is pulled but rather of the number of times it has been pulled so far, with
different arms having (potentially) different increasing functions. Our goal is to maximize
the reward we achieve. Some real-world problems captured by this framework include:
training multiple learning algorithms, when the performance of an algorithm improves
with resources expended and some algorithms are ultimately better than others for the
setting at hand [HKST96, LJD+17, LJG+20]; developing new technologies, where investing
resources into developing a technology may increase its efficiency and different technologies
have different asymptoting utility values [Riv23]; or even the problem of deciding what
research area to work in.
In each of these examples, each algorithm or technology is
represented by one bandit arm, and the reward achieved from pulling the arm increases as
it is pulled more. The goal, then, is to find a sequence of arms to pull that will maximize
some objective.
Various objectives might be valid to consider depending on the intended application.
Since we are considering rewards (rather than costs), we will always aim to maximize the
objective. In some cases, we might want to maximize the total reward accrued (for instance
if studying many topics, we might value overall knowledge acquired).
In other cases,
we may wish to simply identify the best option among the options we are considering,
and therefore it suffices to maximize the maximum value of a single pull.
For any of
these objectives, we can measure the suboptimality of what is achieved by the algorithm
relative to the optimal possible additively (regret) or multiplicative (competitive ratio).
In this thesis, we consider multiplicative suboptimality in the interest of generality. This
is discussed further in Section 2.2.
9
Now, we have have two main questions to consider: (1) what algorithm allows us to
maximize the objective?
(2) what is the best possible performance of any algorithm?
These two questions correspond to showing upper and lower bounds, respectively, on the
suboptimality (competitive ratio). These results depend on how the instances are chosen,
i.e., how much power the adversary has. For a theoretical computer scientist, it is natural
to consider a very powerful adversary who can choose a worst-case instance. While results
in this perspective are very strong, they can also be somewhat pessimistic. Thus, in order
to impose a little more structure, it might instead make sense to limit an adversary to
constructing a distribution from which the instance will be randomly sampled. In such a
setting, the algorithm designer has access to a fixed set of samples from this distribution
when designing the algorithm. We consider both of these perspectives in this part.
Summary of Part I
In this section of the thesis, we discuss a setting where the structure
of the reward is increasing. We study the improving multi-armed bandits problem in both
the worst-case setting and a setting that makes a distributional assumption on instances
we see. In doing so, we unveil nearly-optimal algorithms in the worst case and develop a
framework for learning good algorithms from historical data. In this chapter, we motivate
the setting and formally define it. In Chapter 3, we study the problem with the goal of
optimizing over worst-case instances. We provide a lower bound and analyze algorithmic
building blocks that nearly achieve this lower bound. In Chapter 4, we study the problem
with the goal of developing algorithms that perform well on average on instances drawn
from some distribution. We motivate these two perspectives in the respective chapters.
At a high level, these perspectives are complementary and therefore useful, as they help
us first isolate what is possible in general and then posit deployment of our methods to
settings where we have slightly more information about a specific instance before having
to solve the instance.
2.2
