---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Beyond Generalist LLMs: Specialist Agentic Systems for Structured Code
Workflow Execution
Harris Borman * 1 Herman Wandabwa * 1 Fusun Yu 1 Sandeepa Kannangara 1 Justin Liu 1 Anna Leontjeva 1
Ritchie Ng 1
Abstract
Large Language Models (LLMs) have acceler-
ated the adoption of software development agents,
now widely available as Integrated Development
Environment (IDE) extensions and standalone
applications. While these agents are typically
general-purpose, it remains unclear whether spe-
cialist agents justify their additional development
effort. We investigate this question in the context
of business process automation, focusing on the
transformation of Business Process Model and
Notation (BPMN) diagrams into executable agen-
tic workflows. Since BPMN specifies explicit
control-flow semantics, we focus on deterministic
workflows in which a fixed process model and
inputs uniquely determine the executed path. We
introduce a specialist workflow for this task and
compare it against generalist agents such as Roo
and Cline. Our results show that the specialist
solution produces agents that outperform gener-
alist baselines by approximately 9–20 percentage
points in tool-use exactness, 2–4× in penalty-
adjusted latency, and 3× fewer tool-call errors,
while reducing generation token cost by over 95%
and eliminating repair iterations. We also find
that generalist agents generate code inconsistently
in both functionality and quality, limiting their
suitability for industrial settings where reliability
and maintainability are essential.
1. Introduction
The emergence of LLMs has accelerated the rise of au-
tonomous software agents (Ferrag et al., 2025). These AI-
driven agents now appear as IDE extensions and stand-alone
1Commonwealth Bank of Australia, Sydney, Australia. Cor-
respondence to: Harris Borman <harris.borman@cba.com.au>,
Herman Wandabwa <herman.wandabwa@cba.com.au>.
Proceedings of the 43 rd International Conference on Machine
Learning, Seoul, South Korea. PMLR 306, 2026. Copyright 2026
by the author(s).
no-code assistants, enabling even non-programmers to build
simple applications within minutes (He et al., 2025). Most
operate as generalists, leveraging foundational LLMs to per-
form a wide range of tasks. For example, an open-source
coding assistant like Roo Code can plan, write, and debug
code across domains directly in a developer’s editor (Sap-
kota et al., 2025). Similarly, multi-agent frameworks such
as FLOW, AFLOW, AutoGen, or MetaGPT coordinate sev-
eral LLM agents with predefined roles to solve complex
problems in a general way (Niu et al., 2025; Zhang et al.,
2025b; Wu et al., 2024; Hong et al., 2024). These systems
have been applied to tasks ranging from web browsing and
data analysis to game design and UI creation (Fourney et al.,
2024). Prior work has largely focused on what we define
as “generalist systems”, a system of agents that are able to
complete a wide range of tasks, with architectures suited to
free exploration of various ideas to complete a task in an
unspecified manner (Sapkota et al., 2026). This adaptabil-
ity has driven adoption, including IDE extensions such as
Roo and Cline (Sapkota et al., 2025; Cline, 2025). These
systems are useful because they can create a complete sys-
tem from a single prompt with minimal user intervention,
allowing users with limited technical knowledge to build
a functioning system from a simple idea (Sapkota et al.,
2026).
However, these systems have drawbacks. Their generalist
design often demands extensive planning and increases to-
ken and cost overhead, especially during rapid or repeated
development. They may also lack awareness of company-
specific best practices, such as style guides or preferred
methods. While experienced users can impose constraints
and refine outputs, this remains imperfect and does not guar-
antee consistency across many generations, as discussed in
Section 3. This inconsistency can increase technology debt
and complicate future updates and maintenance (Aljohani
& Do, 2025).
An alternative paradigm is what we define as a “special-
ist system”. These systems use a well-defined and con-
strained agentic workflow designed for a specific class of
tasks. Rather than asking an LLM to generate solutions from
scratch, specialist systems encode expert knowledge into
a templated workflow. Within this scaffold, the LLM per-
1
arXiv:2607.14456v1  [cs.SE]  16 Jul 2026
