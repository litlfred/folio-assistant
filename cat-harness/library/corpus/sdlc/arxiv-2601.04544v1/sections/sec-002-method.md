---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-002-method
section_title: "Method"
section_number: null
pages: 2-3
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
2
TCAndon-Router
directions. Early approaches largely employed BERT-style encoders [20], formulating routing as a fixed
single-label classification problem grounded in a predefined intent space and model structure. To support
adding new agents without retraining, some studies shifted toward KNN-based methods, such as com-
puting similarity between query and agent representations[21], or using query–agent dual-tower models
or fusion-based cross-encoders [22] to dynamically compute relevance scores. [9]Train a binary classifier
to determine whether the model performs excellently on a specific task. More recently, LLM-based rout-
ing methods have emerged—for example, ArchRouter [5] leverages human preference to perform agent
selection. AgentRouter[23] Transform MAS into a knowledge graph, and decide which agent to select by
predicting the edges through the model. Confidence-Driven LLM Router[24] decide which agent is better
based on the confidence of the responses output by different agents, thereby obtaining labeled preference
data, which is then used to train the routing model. However, these methods still follow the paradigm of
producing a single agent output, lacking explicit and structured reasoning explanations. As a result, they
struggle to handle the complexity and interpretability demands in real enterprise environments where
multiple agents may simultaneously be relevant.
Multi-agent collaboration frameworks have also advanced rapidly in recent years. Representative systems
include AutoGen [25], CAMEL [26], and CrewAI [27], which enable multiple agents to jointly solve
complex tasks through mechanisms such as message passing, role-playing, and multi-turn dialogues.
However, these frameworks typically rely on manually specified participant agents or simple rule-based
selection. Their focus lies in how agents collaborate to execute a task rather than which agents should
participate. Consequently, they lack a systematic mechanism for identifying the relevant subset of expert
agents from a larger pool, and they pay limited attention to how the outputs of multiple agents should
be integrated into a coherent final answer.
3
Method
We present TCAR, an adaptive reasoning router for multi-agent collaboration
3.1
