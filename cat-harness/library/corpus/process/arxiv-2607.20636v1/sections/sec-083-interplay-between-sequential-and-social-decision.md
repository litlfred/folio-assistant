---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-083-interplay-between-sequential-and-social-decision
section_title: "Interplay between sequential and social decision-making"
section_number: null
pages: 111-112
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Let us consider the original unifying framework introduced in Chapter 1.1. We discussed
the idea that by fixing a setting of interest and formalizing an objective whose maximiza-
tion is the desired outcome, we can search for optimal algorithms. We then suggested that
we can, on the other hand, study the relationship between the setting and outcome for a
fixed algorithm aimed at the objective.
In this thesis, Part I focused on the former perspective, while Part II focused on the
second perspective. In Part I, we extensively studied the improving multi-armed bandits
problem. We found various algorithms to solve various reward maximization and best-
arm identification objectives. In Part II, we studied two problems. In Chapter 6, where
we studied the pessimism traps problem, we assumed the decision-making heuristic of
agents was fixed (perfect Bayesian updates), and we examined how changing the reward
structure of the world through subsidies affected outcomes. In Chapter 7, where we studied
grit, we assumed the decision-making heuristic of agents was fixed (maximize competitive
ratio or Bayesian updates) and explored how different payoff times affect different agents’
outcomes. We then investigated how changing the reward of a bandit arm by providing a
subsidy affected outcomes.
Through these complementary perspectives, we were able to characterize decision mak-
ing in both general and specific settings. In the case of IMAB and grit, once we had a
96
theoretically well-understood framework, we could apply it to study social problems. Like-
wise, we can take problems in the social setting and motivate new learning-theoretic or
sequential decision-making models to study. Thus, these two perspectives work in con-
junction to help us understand different aspects of decision-making.
8.2
