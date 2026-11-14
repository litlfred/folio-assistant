---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-005-multi-agent-conflicts
section_title: "Multi-Agent Conflicts"
section_number: null
pages: 3-4
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
Selecting Multiple Agents. Traditional task routing typically formulates routing as a single-label
classification problem:R(Prompt(q, A)) = ai ∈A meaning that each query can only be assigned to a sin-
gle agent. This formulation implicitly assumes strict and mutually exclusive domain boundaries, as well
3
TCAndon-Router
as a clearly defined intent space—assumptions that rarely hold in real enterprise environments. When
multiple agents are simultaneously suitable for handling a query due to overlapping domain responsi-
bilities or cross-domain problem characteristics, an agent conflict occurs, formally defined as: |Aq| > 1.
Existing single-label routers cannot represent this structural property; they are forced to pick only one
agent among multiple plausible candidates. This leads to higher routing error rates, brittle behavior
under cross-domain or ambiguous queries, and a lack of interpretability in routing decisions—ultimately
undermining system stability and trustworthiness. To address this, we redefine routing as selecting a
subset of agents from the full agent set: Aq ⊆A, |Aq| ≥1. The objective is no longer to choose a single
”correct” agent, but to identify all experts that may be relevant to the query.
Reasoning-Based Agent Selection. To effectively model multi-agent conflict scenarios, we reformu-
late routing from a “direct label prediction” task into a two-stage “reason–then–select” process. Specif-
ically, instead of outputting only a discrete agent label, the router generates both a natural-language
reasoning chain Cq and the corresponding agent subset Aq:
(Cq, Aq) = R(Prompt(q, A))
The reasoning Cq is required to explicitly analyze the potential causes of the user query, the relevant
technical stack, and the responsibility boundaries of each agent. This produces a textual explanation
of why the selected agents are relevant to the current query. This design provides two key advantages.
First, the reasoning process encourages fine-grained semantic alignment between the query and agent
descriptions, leading to more stable selection of the appropriate agent subset in cases of overlapping
responsibilities or semantic ambiguity—rather than relying on brittle short-text matching.
Second,
explicit reasoning enhances interpretability: operations engineers can inspect Cq to diagnose routing
errors, refine agent descriptions, or adjust routing strategies, forming a closed feedback loop of ”data →
reasoning →policy”. Experimental results show that, compared with black-box single-label or multi-
label routers, incorporating natural-language reasoning significantly improves routing robustness under
cross-domain, weakly-specified, and noisy queries.
Multi-Agent Collaborative Execution. Once the router is allowed to output multiple agents, po-
tential inter-agent conflicts no longer need to be ”compressed” into a single decision during routing.
Instead, they are explicitly preserved and leveraged downstream through collaborative execution. Given
the routing result Aq = {ai1, . . . , aik}, k = |Aq|,the system invokes all selected candidate agents in par-
allel, with each agent producing a response to the same query rij = aij(q). On top of these responses,
we design a subsequent collaboration and aggregation mechanism. On the one hand, different agents
provide partial yet specialized answers from their own perspectives, helping to cover diverse potential
root causes in cross-domain queries. On the other hand, a downstream aggregation module—the Refining
Agent—filters, aligns, and fuses{rij}into a single consistent final response. Formally, this collaborative
process is defined as:
yq = F({rij}k
j=1)
where F denotes the overall operator of multi-agent collaboration and aggregation. Through the design
of multi-agent selection + collaborative execution + aggregated fusion, the system no longer relies on
a one-shot single-point decision to eliminate conflicts. Instead, conflicts are explicitly transformed into
multi-perspective evidence that is unified at the answer level, thereby improving final response accuracy
and robustness while maintaining high coverage.
3.4
