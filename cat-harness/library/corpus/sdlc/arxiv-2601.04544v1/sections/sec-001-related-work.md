---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-001-related-work
section_title: "Related Work"
section_number: null
pages: 2-2
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
Performance based routing selects among models of different sizes to balance cost and latency. Hybrid
LLM[18] proposes a model based on the BERT architecture to assess the diﬀiculty of a query and make
routing decisions. Self-REF[19] uses an LLM to output a confidence score, For low confidence, it uses an
LLM or rejects the answer, while for high confidence, it uses an SLM.
Task based routing assigns queries to domain-specific expert agents to achieve higher accuracy. This
