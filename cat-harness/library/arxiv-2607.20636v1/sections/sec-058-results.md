---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-058-results
section_title: "Results"
section_number: null
pages: 89-91
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
and report one standard deviation/
√
10 as the error bars. For the subsidy size, we report
the standard deviation over the 100 trials /
√
100 as the error bars. The agents sequen-
tially made their decisions after observing the actions of all preceding agents. Financial
supplements as derived above were introduced to influence the agents’ decisions.
6.5.2
Results
Impact of Financial Supplement on Correct Cascades
Figure 6.1 shows the proportion of correct cascades when a financial supplement is provided
(orange line) to 100 agents compared to when it is not (blue line). The results indicate
a significant improvement in the proportion of correct cascades, especially at lower signal
strengths. For example, with a signal strength of 0.6, the proportion of correct cascades
increases markedly (including across different population sizes (10, 100, and 1000 agents),
see appendix for plots) when the supplement is used. This demonstrates the benefit of the
proposed financial incentive in decision-making.
In contrast, Figure 6.2 shows the proportion of correct cascades without the supplement
for varying numbers of agents. The performance is notably low, particularly for weaker
signals. This highlights the promise of financial interventions in overcoming pessimism
traps and steering agents toward optimal decisions.
Also observe that the number of
agents in the sequence has very little effect – once a cascade forms, there is no new
information to switch out of it even when there are new agents.
74
Figure 6.1: Impact of Financial Supplement on Finding Correct Cascade with Supplement,
100 agents.
Figure 6.2: Probability of Finding Correct Cascade without Supplement
Average Subsidy Progression
To understand the dynamics of the financial supplement, we analyzed the progression of
subsidies over time for different signal strengths. We present results for 100-agent cascades
here, and further experiments can be found in the appendix in the full version.
Figure 6.3 presents the average subsidy progression for a population of 100 agents. The
75
Figure 6.3: Average Subsidy Progression for 100 Agents
required subsidy stabilizes after a few agents have made their decisions, indicating that
once the initial agents are guided correctly, the need for subsequent subsidies diminishes, a
benefit for allocation of resources. The line for the weakest signal levels off – based on our
theoretical results, we know that it takes a long time to stabilize when the signal margin
is narrow.
Interestingly, the required supplement was smallest among the first few agents in the
setting with the weakest private signal. We observe a spike in the supplement needed at
the beginning, yet the necessary supplement typically returns to zero quite quickly. All
three plots, however, show that in the case where p = 0.51, the subsidy stays consistent
across the population. This is likely because the signal is weak enough that it takes too
long on average for the best action to be detected compared to the number of agents. It
is also interesting to observe the average starting times for the subsidies, which align with
the beginning of the pessimism trap and almost always begin within the first 10 rounds.
6.5.3
