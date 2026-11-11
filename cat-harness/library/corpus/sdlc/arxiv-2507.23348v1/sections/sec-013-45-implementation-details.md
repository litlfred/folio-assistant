---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-013-45-implementation-details
section_title: "Implementation Details"
section_number: 4.5
pages: 6-6
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
We implement SWE-Debate by extending the SWE-Search [1] frame-
work with our graph-based localization and multi-agent debate
components. Due to unsuccessful testbed setup, we did not utilize it
in our experiments. The code dependency graph is constructed us-
ing static analysis tools2, and the multi-agent debate employs offical
DeepSeek-V3-0324 [8] with different system prompts to simulate
diverse reasoning perspectives. For the graph traversal parameters,
2https://github.com/python/cpython/blob/3.13/Lib/ast.py
we set 𝐾= 5 for the number of entry points, 𝑊= 4 for breadth-
first expansion width, and 𝐿= 5 for maximum chain length. The
multi-agent debate involves 𝑚= 6 chains for competitive ranking
and 𝑁= 5 specialized agents in the competitive refinement process.
These parameters are set based on the a held out set in the full
SWE-Bench dataset [15]. For baseline methods, we directly use the
