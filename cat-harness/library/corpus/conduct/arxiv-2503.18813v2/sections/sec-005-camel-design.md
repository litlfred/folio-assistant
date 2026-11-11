---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-005-camel-design
section_title: "CaMeL Design"
section_number: null
pages: 6-7
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
A trivial way to satisfy the security definition from Section 4 would be to enumerate the full set
of allowable actions Ωprompt for each possible prompt and just check that the Agent never executes
a disallowed action. However, this would be entirely impossible in practice. For this reason, we
design a system that uses principles from software security such as control-flow integrity, capabilities,
and security policies to prevent the Agent from executing disallowed actions without the need to
exhaustively enumerate them.
Our system, depicted in Figure 5, combines the following components:
• the Quarantined LLM: an LLM tasked with parsing unstructured data to structured data;
• the Privileged LLM: an LLM generating code that expresses the user query;
• tools: subroutines which can be invoked by the system to execute specific tasks via predefined
APIs (e.g., a tool to send an email);
• security policies: functions that define what is and what is not allowed when calling tools;
• capabilities: tags assigned to each value that are used to store the value’s sources and allowed
readers;
• the CaMeL interpreter: an orchestrator interpreting the code written by the Privileged LLM,
propagating capabilities, and enforcing security policies.
We also represent the system in relation to the PI-SEC security game in Figure 4. Here, the Agent
takes as an extra argument some global policies, which model the set of allowed actions Ωprompt for
the provided tools.
We now cover each of these components in more detail.
4This set Ωprompt is only used as part of the security definition and not as part of any design of CaMeL.
6
Defeating Prompt Injections by Design
User query
"Find Bob's email in my last email and send him a
reminder about tomorrow's meeting"
Privileged
LLM
email = get_last_email()
address = query_quarantined_llm(
f"Find Bob's email address in {email}",
output_schema=EmailStr
)
send_email(
subject="Meeting tomorrow",
body="Remember our meeting tomorrow",
recipient=address,
)
Quarantined
LLM
Generate code
Process untrusted data
email
address
Data-flow graph and
capabilities
CaMeL interpreter
