---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-000-defeating-prompt-injections-by-design
section_title: "Defeating Prompt Injections by Design"
section_number: null
pages: 1-1
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Edoardo Debenedetti1,3*, Ilia Shumailov2, Tianqi Fan1, Jamie Hayes2, Nicholas Carlini2,
Daniel Fabian1, Christoph Kern1, Chongyang Shi2, Andreas Terzis2 and Florian Tramèr3
1Google, 2Google DeepMind, 3ETH Zurich
Large Language Models (LLMs) are increasingly deployed in agentic systems that interact with an
untrusted environment. However, LLM agents are vulnerable to prompt injection attacks when handling
untrusted data. In this paper we propose CaMeL, a robust defense that creates a protective system
layer around the LLM, securing it even when underlying models are susceptible to attacks. To operate,
CaMeL explicitly extracts the control and data flows from the (trusted) query; therefore, the untrusted
data retrieved by the LLM can never impact the program flow. To further improve security, CaMeL uses
a notion of a capability to prevent the exfiltration of private data over unauthorized data flows by
enforcing security policies when tools are called. We demonstrate effectiveness of CaMeL by solving 77%
of tasks with provable security (compared to 84% with an undefended system) in AgentDojo.
We release CaMeL at https://github.com/google-research/camel-prompt-injection.
