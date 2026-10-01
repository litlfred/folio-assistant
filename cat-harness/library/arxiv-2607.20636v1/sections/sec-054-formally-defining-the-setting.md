---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-054-formally-defining-the-setting
section_title: "Formally Defining The Setting"
section_number: null
pages: 87-87
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We define the setting formally below.
Definition 6.4.1. Suppose that in the world, there are two potential actions A and B .
Each agent in the world has an index in [k] associated with them which we call their group.
For each group in [k] , one of the actions is the “right” one and the other is the “wrong”
one. Notably, which action is correct differs between groups. Formally, we may assume
the correct action for a group is A with probability 1/2 and B with probability 1/2.
At time t , the “universe” draws an index j ∼G , where G is a distribution supported
on [k] , with j signifying the group index, and the minimum value of the probability mass
function is gmin. It is a new agent’s turn to make a decision, and they are a member of
group j . This agent sees the subsidy history for all agents and need rationally only consider
the action history of those in group j who have gone before them. They receive a private
signal st , which is the correct action for the group to which they belong with probability
pj > 1/2 and incorrect with probability 1−pj . They consider their group history and private
signal to update their posterior belief as shown in Equation 6.1, and then incorporate the
present subsidy to make their final decision.
Next, we define the subsidy scheme followed by the government. In fact, it suffices to
define a uniform distribution over the possible values the subsidy would need to take, i.e.,
all values that would encourage signal-revealing in an agent before that agent’s group hits
a cascade.
Definition 6.4.2. Let vx,p be the size of subsidy that causes signal revelation by the current
agent when there are x more A actions than B ones. Define distribution D as supported
on V, all possible values of vx,p , and having probability mass associated with any vx,p as
1/|V| . The government draws the subsidy they provide from this distribution D .
6.4.2
