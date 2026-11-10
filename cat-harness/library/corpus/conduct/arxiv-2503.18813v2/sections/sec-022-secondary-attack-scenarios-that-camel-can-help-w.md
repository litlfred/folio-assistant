---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-022-secondary-attack-scenarios-that-camel-can-help-w
section_title: "Secondary attack scenarios that CaMeL can help with"
section_number: null
pages: 22-23
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
We note that CaMeL can also be used in threat models even stronger than the well-known prompt
injection threat model, where compromise can come from the user, data, tooling, or any combination
of the three.
CaMeL can be used to stop rogue users and tools from violating security policy of the overall system
(e.g., corporate security policies). Although this scenario receives little attention in the academic
literature, it presents one of the biggest threats in an industrial setting. For example, in 2014 PwC
attributed 44% of all data compromises to insider threats (PricewaterhouseCoopers, 2018), while
more recent Cost of Insider Threats Global Report finds that 50% of insider compromises are due
to negligence, while 26% are malicious insiders (Ponemon-Institute, 2022). Here we discuss two
kinds of such insiders – one is the compromised user who issues a command that violates underlying
security policy; the other is the maliciously added tool to the system that aims to steal user data.
Scenario 2: External Spy Tool The scenario in Figure 17a focuses on the risk of unauthorized data
access by externally installed tools. A malicious actor introduces a spy tool whose documentation
prompt injects the agent in a way that the model would choose it (as demonstrated possible by Nestaas,
Debenedetti, and Tramèr (2025)) and would pass it all the data being observed by the agent. Similarly
to a keylogger or screen scraper (but within ML context), the tool passively monitors and exfiltrates
data processed by the agent, including sensitive private information. The attack could be intentional,
with a user knowingly installing a malicious tool, or unintentional, with the user unknowingly
installing compromised software. This scenario illustrates a control flow-based adversary and is not
explicitly addressed in AgentDojo.
Scenario 3: Rogue User The scenario in Figure 17b addresses the threat posed by malicious insiders
or compromised user accounts. A user with legitimate access to the Agent intentionally misuses the
22
Defeating Prompt Injections by Design
system to violate security policies. In this example, the user modifies a prompt to include an external
email address, attempting to send confidential financial documents outside the organization. This
scenario illustrates a stronger adversary that can manipulate the control and data flows and is not
explicitly addressed in AgentDojo (Debenedetti et al., 2024b).
The threat models described above are extremely realistic and mimic the everyday security consider-
ations of a large agent-based system that are in production today. The complexity of these threats
and the limitlessness of expected agentic functionality inspired the design of CaMeL. To the best of
our knowledge, using capabilities for agents has not previously been considered, and we find that it
provides strong security guarantees that current capability-less systems do not.
