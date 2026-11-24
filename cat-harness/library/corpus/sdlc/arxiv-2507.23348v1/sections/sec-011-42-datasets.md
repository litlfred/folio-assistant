---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-011-42-datasets
section_title: "Datasets"
section_number: 4.2
pages: 5-6
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
We evaluate SWE-Debate on the SWE-Bench-Verified dataset [26],
which contains 500 verified issues from SWE-bench [15]. We also
evaluated on SWE-bench-Lite [15], which contains 300 carefully
selected tasks.
4.3
Baselines
We compare SWE-Debate with the following baselines on issue
resolution:
• Agentless [43]: A non-agentic pipeline that breaks down the
repair process into different phases of localization, repair, and
patch validation.
Conference’17, July 2017, Washington, DC, USA
Li et al.
• AutoCodeRover [52]: A software engineering-oriented ap-
proach that combines LLMs with sophisticated code search
capabilities.
• SWE-Agent [46]: A custom agent-computer interface enabling
LM agents to interact with repository environments through
defined actions.
• SWE-Search [1]: A repository issue resolution agent that uses
Monte Carlo Tree Search (MCTS) to explore the solution space.
• SWESynInfer [21]: An open-source LLM series trained with
development-process-centric data, simulating repository anal-
ysis, fault localization, and patch generation via a three-stage
Chain-of-Thought workflow.
• OpenHands [38]: An open-source platform for building general-
purpose AI agents that solve software and web tasks through
code, terminal, and browser interaction.
Additionally, we select the following baselines to compare the
performance on fault localization:
• CodeActAgent [38]: An agent that interact with environments
through executing file system search commands to locate faults.
• LocAgent [6]: A graph-guided LLM-agent framework designed
to enhance code localization through powerful multi-hop rea-
soning.
• KGComposs [45]: A framwework ridges semantic gaps in
repository-level repair by constructing a repository-aware knowl-
edge graph and leveraging path-guided reasoning to enhance
LLM-based patch generation.
4.4
