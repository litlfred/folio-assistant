---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-003-problem-formulation
section_title: "Problem Formulation"
section_number: null
pages: 3-3
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
A multi-agent system consists of a set of expert agents with different domain specializations. Let A =
{a1, a2, ..., aN} denote the set of all available expert agents. In real systems, each expert agent is not hard-
coded into the router through a fixed identifier; instead, it exposes its capabilities and responsibilities
to the routing model through a natural-language description. We denote this description as di, and
define a natural-language ”encoding function” g such that g(ai) = di.The set of all descriptions is
D = {d1, d2, ..., dN} Given a user query q, the router does not operate directly on q alone. Instead, it
receives a full prompt formed by concatenating the routing instruction, the user query, and all agent
descriptions. Formally, we define a prompt construction function:
Prompt(q, A) = Φ(ins, q, D)
where Φ denotes ordered text concatenation and ins is the router instruction. The routing task is then
to output both the reasoning Cq for agent selection and the final selected agent set Aq:
R : Prompt(q, A) →(Cq, Aq)
3.2
