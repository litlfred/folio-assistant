---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-005-31-problem-formulation
section_title: "Problem Formulation"
section_number: 3.1
pages: 3-3
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Given an issue description 𝑝and a codebase state represented as
a set of code entities 𝑉= {𝑣1, . . . , 𝑣𝑚}, an agent must identify
the subset of entities to be modified 𝑉𝑚𝑜𝑑⊂𝑉through an explo-
ration chain {(𝑎1,𝑜1), . . . , (𝑎𝑛,𝑜𝑛)}, where 𝑎𝑡and 𝑜𝑡denote the
action and observation at time step 𝑡. Current approaches, however,
face two fundamental limitations. First, their exploration is ineffi-
cient as it overlooks structural relationships between code entities
(e.g., classes, methods). Second, they struggle with modification
disambiguation when multiple locations seem relevant but require
different reasoning perspectives for a correct evaluation.
Our approach addresses both limitations through competitive
reasoning on a code dependency graph 𝐺= (𝑉, 𝐸), where 𝑉is the
set of code entities and 𝐸represents their structural relationships.
We construct localization chains 𝐶= (𝑣1, . . . , 𝑣𝑘) composed of code
entities 𝑣𝑖∈𝑉that trace fault propagation paths. Subsequently, we
employ a multi-agent debate to resolve modification disambiguation
and determine the most effective fix plan.
Our framework operates on the principle that accurate fault
localization requires diverse structural viewpoints combined with
rigorous evaluation mechanisms, as illustrated in Figure 2. To achieve
this, we employ a dual-stage competitive debate architecture. The
first stage (Section 3.2) tackles the structural exploration problem
by efficiently identifying potential fault propagation paths through
graph traversal. The second stage (Section 3.3) performs compet-
itive debate on chain selection and modification disambiguation
among multiple agents. Finally, the selected modification plan is
integrated into an MCTS-based agentic framework for patch gener-
ation (Section 3.4).
3.2
