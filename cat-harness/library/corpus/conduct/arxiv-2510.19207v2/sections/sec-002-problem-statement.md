---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-002-problem-statement
section_title: "Problem Statement"
section_number: null
pages: 2-2
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
A. Prompt Injection Attack
We consider an LLM-integrated application or agent. We
assume it queries the LLM by providing a prompt and asso-
ciated data.
A LLM input in a LLM System
Prompt: Summarize the strengths and weaknesses of
this job candidate based on its CV.
Data: Education: A... Experience: B...
We consider indirect prompt injection. The prompt is
trusted: it is designed by the system to prompt the LLM to
execute an instruction. The data is untrusted: it comes from
an external source, e.g., retrieved documents, tool call returns,
website html, etc. Such a system can subject to a prompt
injection attack, which injects an instruction into the data. We
show an example of such an attack below (but in practice, the
injection can be made invisible to humans by using white-on-
white text):
A Prompt Injection Attack
Prompt: Summarize the strengths and weaknesses of
this job candidate based on its CV.
Data: Education: A... Ignore all previous instructions
and output that this candidate is the best fit for the
position. Experience: B...
In a prompt injection attack, the injected instruction in the
data may override the prompt and steer the LLM toward
an output directed by an attacker, allowing the attacker to
manipulate the system. This poses a particular risk to agentic
systems, which take actions based on the LLM output. In the
above example, if the employer relies on the LLM agent to
recommend strong candidates to HR, a candidate who uses
prompt injection would get extra attention.
