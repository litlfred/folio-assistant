---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-051-on-our-modeling-choices
section_title: "On Our Modeling Choices"
section_number: null
pages: 83-84
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
A significant contribution of our work is that we propose using the information cascade
model to study pessimism traps and associated interventions. In this section, we justify
our use of this model and discuss the trade-offs made.
Justification
A natural question is: why choose this particular level of abstraction,
i.e., why model the pessimism trap as hinging in this way on decisions made by previous
agents? Several works have empirically characterized this phenomenon in the context of
education, building on which Morton gives an epistemic characterization. At its core, as
conceptualized by Morton, a pessimism trap occurs as a result of people’s beliefs (about
the world, about the rationality of others, etc), realized as herding behavior. Thus, in
order to model this faithfully, we require a model in which we may quantitatively update
the beliefs. A Bayesian formulation is natural for this. Further, though sequentialness is
not inherent to Morton’s characterization of pessimism traps, there is a natural sense in
which agents consider the context of those who went before them when making decisions.
Accordingly, a sequential model is a good choice for organizing the manner in which agents
are influenced.
Strengths
In some sense, the Bayesian posterior update represents the “optimal” ratio-
nal decision. By modeling pessimism traps this way, we are showing that even with perfect
rationality, a trap can form, corroborating Morton’s point that pessimism traps do not
occur due to lack of rationality. Further, as summarized in the appendix, two key features
Morton identifies regarding pessimism traps are: (1) there is evidence of similar people not
succeeding at the ambitious end and (2) not pursuing the ambitious end will not change
the agent’s view of its value. Both of these are well-represented in the information cascade
model. Particularly once we extend to multiple groups, agents are looking to the history of
actions taken by people like them (i.e., in the same group), and witnessing several people
taking a certain action would indicate to them that taking the opposite action does not
tend to be beneficial for people like them. Likewise, in the information cascade model,
there is no feedback for whether a different action would have been correct, and therefore
there is no reason for an agent to change their pessimistic view about it.
68
What this model misses
On the other hand, since the reward from the taken action
is received in one step, this model does not reflect the fact that the ambitious choice re-
quires investment and is contrasted with a choice that has a reasonable payoff throughout.
Similarly, the model does not capture risk associated with the ambitious choice. These
are important modeling considerations for future work.
6.3
