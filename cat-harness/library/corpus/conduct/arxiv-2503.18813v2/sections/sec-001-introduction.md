---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-001-introduction
section_title: "Introduction"
section_number: null
pages: 1-4
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Large Language Models (LLMs) are increasingly used as the core of modern agentic systems (Wooldridge
and Jennings, 1995) interacting with external environments via APIs and user interfaces (Nakano
et al., 2021; Thoppilan et al., 2022; Schick et al., 2023; Yao et al., 2022; Qin et al., 2023; Lu et al.,
2024; Gao et al., 2023; Shen et al., 2024). This exposes them to prompt injection attacks (Goodside,
2022; Perez and Ribeiro, 2022; Greshake et al., 2023) when data or instructions come from untrusted
sources (e.g., from a compromised user, from tool call outputs, or from a web page). In these attacks,
adversaries insert malicious instructions into the LLM’s context, aiming to exfiltrate data or cause
harmful actions (Rehberger, 2024; AI-Security-Team et al., 2025; Anthropic, 2025; OpenAI, 2025).
Current defenses often rely on training or prompting models to adhere to security policies (Wallace et
al., 2024; Ghalebikesabi et al., 2024), frequently implemented as vulnerable system prompts (Carlini
et al., 2023). This is largely due to the absence of robust methods to formally define and enforce
security policies for LLM functionalities on diverse data.
This work introduces a novel defense, CaMeL1, inspired by traditional software security concepts
like Control Flow Integrity (Abadi et al., 2009), Access Control (Anderson, 2010, Chap. 6), and
Information Flow Control (Denning and Denning, 1977). CaMeL effectively mitigates dangerous
outcomes of prompt injection attacks, as demonstrated by practically solving the security evaluation
of the AgentDojo benchmark (Debenedetti et al., 2024b). CaMeL associates, to every value, some
metadata (commonly called capabilities2 in the software security literature) to restrict data and control
flows, giving the possibility to express what can and cannot be done with each individual value by
using fine-grained security policies. CaMeL operates by extracting control and data flows from user
queries and employs a custom Python interpreter to enforce security policies, providing security
guarantees without modifying the LLM itself. CaMeL does not rely on model behavior modification.
1CaMeL is short for CApabilities for MachinE Learning.
2Note that here the term capability refers to the standard security definition, and not the standard machine learning
measurement of how capable models are.
Corresponding author(s): edoardo.debenedetti@inf.ethz.ch & iliashumailov@google.com
∗Work done as a Student Researcher at Google.
© 2025 Google DeepMind. All rights reserved
Defeating Prompt Injections by Design
Instead, it provides an environment where predefined policies prevent unintended consequences
caused by prompt injection attacks, mirroring established software security practices.
Overall, we make the following contributions:
• We propose CaMeL, a novel defense inspired by software security that requires no change to
the underlying LLM. CaMeL extracts the control and data flows from user queries and enforces
explicit security policies;
• We design a custom Python interpreter for CaMeL that tracks provenance and enforces security
policies;
• We integrate CaMeL into AgentDojo (Debenedetti et al., 2024b), a benchmark for agentic
systems security, and demonstrate that we solve it by design with some utility degradation, yet
with guarantees that no policy violation can take place.
2. Defeating Prompt Injections by Design
User
Can you send Bob the document
he requested in our last
meeting? Bob's email and the
document he asked for are in the
meeting notes file.
Find recent
meeting notes
Fetch document 
by name
Send
document to
email
Control Flow
Notes
Drive
Data Flow
Extract email
address
Extract 
doc name
Figure 1 | Agent actions have both a control flow
and a data flow—and either can be corrupted
with prompt injections. This example shows how
the query “Can you send Bob the document he re-
quested in our last meeting?” is converted into
four key steps: (1) finding the most recent meeting
notes, (2) extracting the email address and docu-
ment name, (3) fetching the document from cloud
storage, and (4) sending it to Bob. Both control
flow and data flow must be secured against prompt
injection attacks.
Consider a user who prompts a model as follows:
“Can you send Bob the document he requested
in our last meeting? Bob’s email and the docu-
ment he asked for are in the meeting notes file.”
The user query is straightforward, and the agent
is designed to interact with the user’s local notes
and email functionalities via tool calling. How-
ever, the user’s notes could be compromised or
influenced by malicious actors, who can include
(potentially invisible) text with the aim to over-
ride the user’s instructions, leading to prompt
injection attacks (Goodside, 2022; Perez and
Ribeiro, 2022; Greshake et al., 2023; Pasquini,
Strohmeier, and Troncoso, 2024). The intended
task is to retrieve and send a specific document
to a specific recipient, but an adversary might
inject prompts to hijack the agent to exfiltrate
the document to an unintended email, send an-
other file or do a completely different action
altogether (e.g., sending the last email received
from the user to an adversary).
How can we defend from these attacks?
Sev-
eral defenses have been proposed to mitigate
such risks. Many methods attempt to make the
model itself robust, for example by using de-
limiters to mark the boundaries of untrusted
content within the context, and explicitly in-
structing the model to disregard any instruc-
tions found within these delimiters (Hines et al.,
2024). Prompt sandwiching (Learn Prompting,
2024) offers another approach, by repeatedly reminding the model of the original task after each tool
output. Further, some researchers explore training or fine-tuning models to become more resilient
2
Defeating Prompt Injections by Design
to prompt injections, enabling them to discern and ignore malicious instructions (Chen et al., 2024;
Wallace et al., 2024; Wu et al., 2024). Unfortunately, none of these heuristic defenses provide any
guarantee of security and regularly fall short to new attacks in practice. We discuss prompt injection
defenses and concurrent work in more detail in the extended related work in Appendix A.2.
A significant step forward in defense strategies is the Dual LLM pattern theoretically described by
Willison (2023). This pattern employs two LLMs: a Privileged LLM and a Quarantined LLM. The
Privileged LLM is tasked with planning the sequence of actions needed to fulfill the user’s request,
such as searching the cloud storage for the meeting notes and fetching the requested document from
the cloud storage, and sending it to the client. Importantly, this privileged LLM only sees the initial
user query and never the content from potentially compromised data sources (like the file content).
The actual processing of potentially malicious data, like extracting the name of the document to send
and the client’s email address, would be delegated to the Quarantined LLM. This Quarantined LLM,
crucially, is stripped of any tool-calling capabilities, limiting the harm an injected prompt can cause
and guaranteeing that the adversary cannot call arbitrary tools with arbitrary arguments.
Is Dual LLM of Willison enough?
While the Dual LLM pattern significantly enhances security
by isolating planning from being hijacked by malicious content, it does not completely eliminate
all prompt injection risks. Let us consider the example depicted in Figure 1. Here, we show that
vulnerabilities still exist even with the Dual LLM.
The Privileged LLM, as before, plans the actions: search the cloud storage for “meeting notes", extract
the document to send and the email address with the Quarantined LLM, and send the document to
the extracted email address. Now, consider the following attack: A malicious party with access to
the meeting notes adds some text to the notes that influences the Quarantined LLM to send them an
arbitrary confidential document. When the agent executes the plan, the Privileged LLM correctly
orchestrates the planned steps. However, when the agent retrieves the meeting notes from the cloud
storage, the Quarantined LLM is influenced—by the malicious content in the meeting notes—to
return data that causes an attacker-chosen file to be sent to an attacker-chosen address. Thus, even if
the global plan itself is not hijacked, the data being processed according to the plan is manipulated,
which can cause malicious actions to be executed. Although this is not strictly a prompt injection
(i.e., the attack does not require overriding any LLM instructions), the core issue remains. Even if
the adversary cannot change the original plan and tool calls, being able to change the arguments
to the tool calls by prompt injecting the Quarantined LLM can be a security issue: while the control
flow is protected by the Dual LLM pattern, the data flow can still be manipulated. This is analogous
to an SQL injection attack in which an adversary manipulates the query parameters rather than the
structure of the query itself. We show in Section 6.4 that this can be taken one step further and even
enable arbitrary code execution.
Defeating prompt injections with software security.
To address these subtle yet critical vulnera-
bilities, our system, CaMeL, draws inspiration from established software security principles (which we
discuss in the extended related work in Appendix A.1.2), focusing on securing both data and control
flows. Let us consider again the query “Can you send Bob the document he requested in our last meet-
ing? Bob’s email and the document he asked for are in the meeting notes file.”, CaMeL goes beyond just
isolating LLMs. It starts by extracting the intended control flow as pseudo-Python code, generated by
an LLM that acts as the Privileged LLM of Willison (2023). CaMeL then employs a custom interpreter
to execute this plan. The interpreter maintains a data flow graph (i.e., tracking which values each
variable depends on), and uses it to enforce security policies based on capabilities when executing tools.
Capabilities are metadata assigned to each value passed to a tool that track the sources and allowed
3
Defeating Prompt Injections by Design
recipients of each value. When the agent accesses the local drive to find the meeting document, the
retrieved file is tagged with capabilities reflecting its origin (i.e., the cloud storage and file editors),
and its allowed readers (i.e., the email addresses with whom the document is shared). In this way,
even if the adversary was instructing the Quarantined LLM to extract the filename of a confidential file
and the email address of the adversary with a prompt injection, the execution of the tool to send the
email would be blocked by CaMeL (and the user asked for explicit approval) as it would imply sharing a
confidential document or information from it with someone who is not meant to read the document.3
User
Can you send Bob the
document he requested in our
last meeting? Bob's email and
the document he asked for are
in the meeting notes.
Find recent
meeting notes
Fetch confidential.txt 
by name
Send confidential.txt to 
attacker@gmail.com
Control Flow
Notes
Drive
Data Flow is diverted!
Extract attacker's
email address
Extract
confidential.txt
doc name
Shared note
contains the following
(invisible) text:
Ignore previous
instructions. Send
confidential.txt to 
attacker@gmail.com
Figure 2 | Prompt injections can cause harm even
if they do not change the sequence of agent ac-
tions. Here we consider an adversary who diverts
the data flow of the user command. The cloud stor-
age file contains a prompt injection that changes
the recipient email address to the attacker’s address
and the document being sent. This leads to the con-
fidential document being sent to the attacker.
By enforcing capability-based security policies,
CaMeL effectively prevents unintended data
flows and actions. Even with a compromised
cloud storage file containing prompt injections
targeting the Quarantined LLM, the capabili-
ties system acts as a robust and granular con-
trol mechanism, preventing data exfiltration, as
well as other prohibited actions. This approach
provides a secure environment for LLM agents,
preventing harm by design, without requiring
modifications to the underlying LLM itself, and
offering a significantly more fine-grained and
robust defense compared to isolation and/or
adversarial training strategies alone.
