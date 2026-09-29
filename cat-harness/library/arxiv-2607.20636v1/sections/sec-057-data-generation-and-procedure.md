---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-057-data-generation-and-procedure
section_title: "Data Generation and Procedure"
section_number: null
pages: 89-89
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
The data for our experiments were generated through simulations that model the sequen-
tial decision-making process of agents. Each agent must choose between two actions, A
and B, where A is uniformly the better option, though this is unknown to the agents a
priori. The agents receive private signals indicating the correctness of their choice, with a
probability p of being correct. Each simulation was conducted as follows: We initialized a
population of N ∈{10, 100, 1000} agents to explore the effects of population size on even-
tual cascade behavior. Each agent received a private signal with strength p ∈[0.51, 0.99].
For each pair of values for N and p, we repeat the experiment 100 times and average the
