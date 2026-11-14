---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
As large language models (LLMs) continue to improve in agent-based scenarios, multi-agent systems
(MAS) have become increasingly mature. Their core idea is to decompose complex problems into smaller
sub-tasks, each of which is handled by a specialized expert agent [1]. Representative applications include
Vibe Coding [2] and Deep Research [3].Today, large-scale enterprise systems—such as those in finance,
healthcare, education, and cloud computing are also increasingly relying on multi-agent architectures
to deliver accurate and eﬀicient problem solving capabilities. Despite their broad applicability, MAS
still face numerous challenges, including agent collaboration [4], routing [5], and security [6]. As these
ecosystems become more complex, routing becomes particularly crucial: it determines which agent should
handle each specific task and therefore sets the lower bound for the overall performance of the MAS.
Current routing strategies generally fall into two paradigms. The first is performance based routing, as
depicted in 1(a) which dynamically selects LLMs of different sizes based on the estimated diﬀiculty of a
query to balance precision and cost[7, 8, 9]. The second is task based routing, as shown in 1(b) which
assigns user queries to domain-specific expert agents to achieve higher task precision[5]. Performance
based routing focuses on computational eﬀiciency and model selection, whereas task based routing serves
as the backbone of enterprise multi-agent systems by ensuring that queries are handled by domain
experts rather than general-purpose models. Despite its strong performance, task based routing faces
a critical limitation in real-world enterprise environments: agent conflicts.
Unlike clean academic
datasets, enterprise scenarios often involve overlapping agent responsibilities and multi-intent queries.
For example, in cloud computing, an issue such as ”website latency” can simultaneously be related
to CDN configuration, public network quality, or application-layer bottlenecks. Traditional task based
routers typically rely on single-label classification, which forces a single choice even when multiple experts
1
arXiv:2601.04544v1  [cs.AI]  8 Jan 2026
TCAndon-Router
Figure 1: (a) performance router, which balances latency and cost across models of different sizes. (b)
task router, which assigns queries to domain-specific experts to improve accuracy.
are appropriate. This leads to routing errors, brittle behavior under ambiguous queries, and reduced
system reliability. Furthermore, most routers support only static routing, making them diﬀicult to adapt
to dynamic category changes in enterprise environments. The lack of explicit reasoning during routing
also limits interpretability and robustness.
To address these challenges, we propose TCAR, adaptive reasoning router for multi-agent collaboration.
Unlike existing routers that can only output a single label, TCAR generates structured natural language
reasoning [10] and identifies all expert agents that may be relevant to the current problem. This design
transforms routing from a traditional black-box classification task into a transparent and interpretable
reasoning process, enabling the system to articulate when and why multiple agents might be applicable.
Beyond the agent selection mechanism, we further introduce a novel collaborative execution pipeline.
Each selected expert agent first produces a domain-specific response, after which a Refining Agent [11]
aggregates and reconciles these outputs to form a logically coherent final answer.
This architecture
aligns with recent advances in collaborative multi-agent LLM systems, where domain experts provide
complementary perspectives and a coordinator synthesizes the final decision [12, 13].This paradigm also
mirrors human organizational workflows: multiple subject-matter experts contribute their insights, and
a senior analyst ultimately integrates them into a unified conclusion.
We evaluate TCAR on public benchmarks (CLINC150 [14], HWU64 [15], MINDS14 [16], and SGD
[17]) as well as on a private dataset from real-world cloud computing scenarios. Experimental results
demonstrate that combining multi-agent routing with a refinement mechanism significantly improves
accuracy, reduces routing conflicts, and enhances system robustness when handling ambiguous or cross-
domain queries.
The main contributions of this work are as follows:
• A reasoning-centric multi-agent routing system. We introduce TCAR, the first domain router that
outputs natural-language decision rationales and supports flexible multi-agent selection.
• Conflict resolution through collaborative execution: We propose an innovative ”multi-agent gener-
ation and refinement” pipeline that mitigates agent conflicts and effectively integrates complemen-
tary domain expertise.
• An open-source collaborative routing framework. We release the model and associated resources
to advance research in interpretable multi-agent routing and reasoning-driven LLM collaboration.
2
