---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-004-explicit-non-goals-of-camel
section_title: "Explicit non-goals of CaMeL"
section_number: null
pages: 5-6
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
CaMeL has limitations, some of which are explicitly outside of scope. CaMeL doesn’t aim to defend
against attacks that do not affect the control nor the data flow. In particular, we recognize that it
cannot defend against text-to-text attacks which have no consequences on the data flow, e.g., an attack
prompting the assistant to summarize an email to something different than the actual content of the
email, as long as this doesn’t cause the exfiltration of private data. This also includes prompt-injection
induced phishing (e.g., “You received an email from Google saying you should click on this (malicious)
link to not lose your account”). Nonetheless, CaMeL’s data flow graph enables tracing the origin of the
content shown to the user. This can be leveraged, in the chat UI, for example, to present the origin of
the content to the user, who then can realize that the information is not from a Google email address.
Furthermore, CaMeL does not aim to make a fully autonomous system without any need for human
intervention. As users often make ambiguous queries (or tools might return ambiguous results), users
may sometimes need to be prompted to clarify the expected control and data flows. However, as
we describe in the following section, using capabilities and security policies enables CaMeL to avoid
unnecessarily prompting the user and shifts important security-related decisions to the capability
system, thereby reducing the risk of security fatigue and user desensitization.
4. The Prompt Injection Security Game
We formalize the threat model described in Section 3 as the security game PI-SEC defined in Figure 3.
This game takes as parameters an adversary A, an Agent, and a set of tools that the Agent can use.
The Agent is a procedure that takes as input a user prompt, the set of tools, and a memory mem (i.e.,
a read-writable state on which the tools operate). It executes the prompt, and returns a Trace, i.e., a
set of (tool, args, memstep) tuples which represent the tools called by the Agent while executing the
prompt, the arguments passed to the tool, and the memory at the time of execution.
For each prompt, the set Ωprompt represents the set of allowed actions, i.e., actions that the Agent can
5
Defeating Prompt Injections by Design
CaMeL Agent(prompt, tools, mem, policies)
1 :
Trace ←∅
2 :
tools ←tools ∪Q-LLM
3 :
plan ←P-LLM.plan(prompt, tools)
4 :
for (tool, args) ∈plan do
5 :
if policies.check(tool, args, mem) =⊥then
6 :
return Trace
7 :
mem ←tool(args, mem)
8 :
Trace ←Trace ∪(tool, args, mem)
9 :
return Trace
Figure 4 | CaMeL in the PI-SEC security game. The CaMeL Agent takes as argument some policies
which govern globally-allowed actions for the provided tools (i.e., independently of the prompt). The
policies are checked against before each tool call. If the check fails (i.e., the policy returns ⊥, then
execution is halted.
take without compromising security.4 The adversary’s goal is to provide an initial adversarial state
mem∗for the Agent’s tools, in order to cause the Agent to perform an unsafe action (i.e., one that is
not part of Ωprompt). If the Agent’s execution trace contains such an action, the adversary A wins.
