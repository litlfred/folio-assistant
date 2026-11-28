---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-007-tool-calling-llm-agents
section_title: "Tool-Calling LLM Agents"
section_number: null
pages: 3-4
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
Recent advances in large language models (LLMs) have
enabled their deployment beyond static text generation into
agentic applications, where models act as autonomous or
semi-autonomous decision-makers capable of interacting with
external environments. Users can control them through natural
language, and the models perform iterative reasoning, plan-
ning, and tool use to accomplish multi-step tasks. Advanced
commercial LLMs such as GPT-5 [31] and Claude 4.5 [32]
have built-in tool-use capabilities. Developers build agents
on top of these models, which repeatedly invoke the LLM
to invoke tools (e.g., calling APIs, querying databases, or
executing functions) and plan their next step. This architecture
enables LLMs to serve as general-purpose controllers, but also
exposes them to attack, which motivates research into more
robust and secure agentic systems.
In these pipelines, the system prompt and user prompt are
typically assumed to be trusted, whereas the external data
retrieved from tool calls is considered untrusted. Adversaries
can exploit this channel by embedding hidden instructions
within the data, which may override intended behaviors and
steer the model into executing unintended actions. This class
of vulnerability is commonly referred to as prompt injection.
OWASP [8] has identified as the top threat to LLM-integrated
applications. The threat of prompt injection has been realized
in industry-level products, e.g., Google Bard [7], Slack AI
[26], Bing/Copilot [33], Microsoft 365 Copilot [34], and
Anthropic’s [5] and OpenAI’s [6] web agents. This real-world
impact strongly motivates our data-filtering defense.
B. Prompt Injection Attack
Prior work has identified a diverse range of prompt injection
strategies. In general, prompt injection attacks could be divided
into optimization-free attacks and optimization-based attacks.
Optimization-free attacks exploit the inherent instruction-
following tendency of LLMs without requiring any gradient
or optimization access [35, 36]. We introduce them more
concretely in Section II-D. Optimization-based attacks, such
as Greedy Coordinate Gradient (GCG) and its variants [37,
38], are significantly stronger but typically require extensive
queries to the model and are computationally intensive. The
most advanced optimization-based attackers [12] can break all
existing defenses.
There are a number of standard benchmarks for evaluating
prompt injection. SEP [21] provides a controlled measure-
ment of the effectiveness of prompt injection attacks. InjecA-
gent [22] measures indirect injections hidden inside simulated
tool outputs. AgentDojo [23] evaluates prompt injection in
more complex agentic tasks that require multiple interaction
rounds and evaluates both utility and security. In both In-
jecAgent and AgentDojo, malicious instructions are embedded
within tool-calling responses, highlighting risks specific to
agentic workflows. Other benchmarks, including WASP [39]
and RedTeamCUA [40], study prompt injection in web-agent
scenarios.
