---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-004-dynamic-agent-addition
section_title: "Dynamic Agent Addition"
section_number: null
pages: 3-3
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
Traditional methods typically bind a router R to a fixed agent set A, when A changes R must be
retrained. In TCAR, adding a new agent requires only appending anew to the existing set, yielding
A′ = A ∪{anew} which produces a new description set D′ = D ∪{dnew}, The routing process then
becomes (Cq, Aq) = R(Prompt(q, D′)), Aq ⊆A, meaning that the router R itself does not need to be
modified or retrained to support newly added agents. This property greatly improves eﬀiciency and
usability in real-world enterprise environments.
3.3
