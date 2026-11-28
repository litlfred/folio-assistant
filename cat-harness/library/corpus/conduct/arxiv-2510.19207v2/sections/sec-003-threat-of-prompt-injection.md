---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-003-threat-of-prompt-injection
section_title: "Threat of Prompt Injection"
section_number: null
pages: 2-3
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
Prompt injection has been listed as the #1 threat to LLMs
and Gen AI applications [8]. Successful attacks have been
demonstrated against mainstream LLM agentic products.
Prompt injection attacks can exploit AI agents that interact
with external content. For example, injected prompts in public
documents can cause Google Bard to leak private user conver-
sations [7]. Slack’s AI agent [25] can be abused by injecting
prompts into public channels to leak private channel informa-
tion [26]. Web and computer-use agents are also vulnerable.
Anthropic’s Claude Computer Use [1] can be manipulated by
injected instructions on a webpage to download and execute
malware [5]. Similarly, prompt injections in GitHub issues
have misled the OpenAI Operator [27] into revealing developer
private information [6]. Perplexity’s Comet agent [28] has been
compromised by website injections that redirect it to leak user
data to attacker-controlled servers [29].
The threat from prompt injection holds back the deployment
of agentic AI because of the uncontrollable security risks. With
the concern of data leakage, privacy breaches, and system
manipulation from prompt injections, a product without proper
defenses puts users at risk. This threat will not be solved
merely by scaling up existing models [13], but requires new
defenses.
C. Attacker’s and Defender’s Goal
