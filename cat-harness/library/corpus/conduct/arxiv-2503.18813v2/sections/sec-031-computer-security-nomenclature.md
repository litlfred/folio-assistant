---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-031-computer-security-nomenclature
section_title: "Computer security nomenclature"
section_number: null
pages: 30-31
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
In this work we extensively use terminology from the computer security literature. Security Policy is
defined by Anderson, Stajano, and Lee (2002) as “a high-level specification of the security properties
that a given system should possess”. Such policies describe the overall goals of the system, define
the subjects and the objects in the system, and finally restrict the operations that they can perform.
An example of a policy could be: “no internal Need-to-Know documents should be sent to external
parties.” Currently, such policy is not enforceable for machine learning models in a robust way.
30
Defeating Prompt Injections by Design
We also adopt notions of control and data flows. Control Flow here refers to the execution flow of a
given program or an agent, while Data Flow refers to how data flows within a given execution flow.
Within the context of a classic software program, control flow refers to instructions that are executed
within a program, while data flow refers to how data propagates between the instructions (Abadi
et al., 2009). Capabilities, in turn, are unforgeable “tags”,“tokens”, or “keys”, that grant specific
fine-grained access rights to a resource or functionality (Needham and Walker, 1977). They provide a
flexible way to control what actions, tools, or the agent generally can perform. For instance, imagine
that every file on cloud storage is associated with a capability. Then, we can enforce that a tool can
only execute if it possess a specific file-corresponding capability.
At the same time, defining both control and data flows is generally impossible for machine learning
models,7 since data and control flow are inherently intertwined and it is hard to explicitly separate
the two in generality. However, in an agentic setting with explicit tools and data sources it becomes
possible. For example, consider a user prompt “Can you send Bob the document he requested in our
last meeting? Bob’s email and the document he asked for are in the meeting notes file.” as depicted
in Figure 1. Here, to solve this query the model explicitly needs to perform a sequence of well defined
instructions – find recent meeting notes, find email in the notes, find document name in the notes,
fetch document by name, send email with the fetched document to the fetched email address. With
explicit control flow defined, similarly data flow appears.
