---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-050-single-sequence-model
section_title: "Single Sequence Model"
section_number: null
pages: 81-83
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
First, for the case of a single community (sequence) we assume that A is uniformly the
better option (that is, it is best for all agents), though this fact is unknown to the agents.
When we consider k parallel sequences, then each sequence will have its own better option.
We let EA represent the event that action A is correct and EB represent the event that
action B is correct. When referring to the set of these possible events, we define E ≜
{EA, EB} to indicate the set of possibilities.
In particular, we assume that a priori,
agents have no bias toward either action, which we model by saying that they have a
common, uniform prior over E. Formally, PEA [=] 1
2 and PEB [=] 1
2. Further, one action
has associated with it reward 1 and the other reward 0. In addition to the public prior,
each agent t receives a private signal st indicating that one of A or B is the correct
action. This signal is correct with probability p > 1
2 and incorrect with probability 1 −p.
Therefore, we have Pst|EA [=] pδst,A(1 −p)δsi,B and Pst|EB [=] pδst,B(1 −p)δsi,A, where δ is
the Kronecker delta function.
Given this signal and the actions of preceding agents, the agent decides whether to
take action A or B. Let ht indicate the action of agent t, where an agent is identified by
66
the time they act and Ht−1 be the history of actions for the first t −1 agents. Agent t will
take an action if its expected reward exceeds the expected reward of the other action. For
concreteness, we adopt the tie-breaking convention that if an agent is indifferent between
the two options based on the calculated posteriors, they follow their private signal. Now,
we define an information cascade.
Definition 6.2.1 (Information Cascade). An information cascade occurs when an agent’s
action does not depend on their private signal. This means that one of the following occurs:
1. PEA|st=1,Ht−1 [>] 1
2 and PEA|st=0,Ht−1 [>] 1
2
2. PEA|st=1,Ht−1 [<] 1
2 and PEA|st=0,Ht−1 [<] 1
2
Remark 3. A cascade begins when the observed history Ht−1 becomes sufficiently skewed
towards either adoption or rejection. Therefore, enough previous agents have taken the
same action to make it rational for subsequent agents to follow the trend, based on a
simple Bayesian updating procedure, even if the history contradicts their private signal.
To formally capture the concept of a pessimism trap for a sequence setting, we de-
fine the conditions under which agents, influenced by the actions of their predecessors,
consistently choose the inferior option B. This phenomenon occurs when the aggregated
evidence from prior decisions leads to a bias that overrides the agents’ private signals. We
represent this situation mathematically as follows:
Definition 6.2.2 (Pessimism Trap). A pessimism trap occurs when an information cas-
cade leads agents to consistently choose the inferior action B due to an overwhelming
influence of prior agents’ incorrect actions. Formally, a pessimism trap is defined by the
following condition:
PEB|st=1,Ht−1 [>] 1
2 and PEB|st=0,Ht−1 [>] 1
2
This indicates that despite the private signal st suggesting action A is better, history
Ht−1 has led agent t to believe that B is better. Subsequently, agents’ decisions are based
purely on observed history rather than private signals.
Remark 4. When computing posteriors, we assume that agents only consider actions of
those up until a cascade began, since if agents are rational, they realize that no further
inferential information can be obtained from individuals who do not use their signals.
As a result, we will often be interested in ¯Ht−1, the history of actions taken by agents
who chose an action if and only if it was their signal. We express mathematically the
Bayesian updating procedure through which agents come to their posterior belief about
the best action based on the history of actions before a cascade begins and then formalize
the kinds of governmental / central interventions we study:
P [EA|st, Ht−1] = P

EA|st, ¯Ht−1

=
P [st|EA] P
 ¯Ht−1|EA

P
w∈{A,B} P [st|Ew] P
 ¯Ht−1|Ew

(6.1)
67
Definition 6.2.3. A subsidy of size r toward action a is a benefit provided to an agent
taking said action independent of the true world. Thus, in the world where a is the correct
action, instead of receiving just R reward for taking action a , the agent receives R + r
reward, and in a world in which it is the incorrect action, the agent still receives r reward.
Formulation as Random Walk. The main technical tools used for analysis of the
cascade and subsidy come from framing the process as a random walk. We isolate the
probability with which action A is taken and the probability with which action B is taken,
and we analyze the information cascade as taking steps on a random walk. This walk
in general terminates when either an up or a down cascade has been reached. Once we
introduce a subsidy, the stopping point of interest will be the up cascade. In Appendix C.4,
we show how we can use the random walk formalism to derive the length of time for which
the subsidy must be in place and the required budget.
6.2.2
