---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-000-abstract
section_title: "Abstract"
section_number: null
pages: 1-1
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Issue resolution has made remarkable progress thanks to the ad-
vanced reasoning capabilities of large language models (LLMs).
Recently, agent-based frameworks such as SWE-agent have further
advanced this progress by enabling autonomous, tool-using agents
to tackle complex software engineering tasks. While existing agent-
based issue resolution approaches are primarily based on agents’
independent explorations, they often get stuck in local solutions
and fail to identify issue patterns that span across different parts of
the codebase. To address this limitation, we propose SWE-Debate, a
competitive multi-agent debate framework that encourages diverse
reasoning paths and achieves more consolidated issue localization.
SWE-Debate first creates multiple fault propagation traces as local-
ization proposals by traversing a code dependency graph. Then, it
organizes a three-round debate among specialized agents, each em-
bodying distinct reasoning perspectives along the fault propagation
trace. This structured competition enables agents to collaboratively
converge on a consolidated fix plan. Finally, this consolidated fix
plan is integrated into an MCTS-based code modification agent
for patch generation. Experiments on the SWE-bench benchmark
show that SWE-Debate achieves new state-of-the-art results in
open-source agent frameworks and outperforms baselines by a
large margin1.
1
