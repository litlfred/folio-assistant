---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Published as a workshop paper at SCALE - ICML 2026
While robust in predictable environments, they provide
limited support for dynamic or context-sensitive decision-
making (Van Der Aalst et al., 2020). Prior work has tried to
address this through agent-based automation (Wooldridge
& Jennings, 1995), adaptive workflow systems (Reichert &
Weber, 2012), context-aware frameworks (Rosemann et al.,
2008), and decision-centric models (Batoulis et al., 2015).
BPMN extensions have also been proposed to support more
adaptive workflows (Braun et al., 2014), but execution re-
mains largely constrained by static semantics (Mendling
et al., 2018). As a result, traditional BPMN execution still
struggles with unstructured data, runtime variability, and
ambiguous decision logic (Marrella, 2019).
2.2. LLMs and Agentic Workflows
Recent advances in Large Language Models (LLMs) have
expanded their role from passive predictors to agents capa-
ble of reasoning, planning, and executing tasks from natural
language instructions (Wei et al., 2022). Agentic workflows
build on this by combining reasoning with tool use to en-
able autonomous task completion with limited human over-
sight (Schick et al., 2023). Architectures such as ReAct (Yao
et al., 2023b), Tree-of-Thoughts (Yao et al., 2023a), and
PAL (Gao et al., 2023) illustrate this shift toward adaptive
task coordination and decision-making (Yang et al., 2023).
Research has also explored external memory, planning mod-
ules, and tool integration (Wu et al., 2024). Systems such
as AFLOW (Zhang et al., 2025b) and MaAS (Zhang et al.,
2025a) further show the promise of agentic AI for complex
tasks such as retrieval, analysis, and decision-making (Sing-
hal et al., 2023). However, these systems also raise chal-
lenges around traceability, control, and integration with
structured workflow representations such as BPMN (Mi-
alon et al., 2023; Deng et al., 2023). Most remain general-
purpose frameworks, with less attention given to specialist
workflows for narrowly defined structured automation tasks.
2.3. BPMN and LLM Integration
Initial work on BPMN and LLM integration has focused
mainly on modelling rather than execution. Representative
directions include generating BPMN diagrams from text,
conversational refinement of process models, and workflow
mining (K¨opke & Safan, 2024; Nour Eldin et al., 2025;
Toxtli & Li, 2025; Berti et al., 2024). These approaches im-
prove accessibility for non-experts, but they generally treat
BPMN as a static artefact rather than a basis for executable
agentic behaviour.
More recent work has moved toward agentic automation,
where LLMs synthesise workflows and execute tasks across
tools and APIs (Jain et al., 2024; Zeng et al., 2023; Ye et al.,
2023). Despite this progress, a key gap remains in combin-
ing BPMN’s formal process structure with the flexibility
of LLM-driven agents. In particular, reliably executing
BPMN-defined workflows while preserving semantic rigour
and handling unstructured inputs remains an open challenge.
3. Methodology
To evaluate the efficiency and performance gains of a
specialist agent, we designed one for converting BPMN-
specified workflows into ReAct agents. We evaluated each
system using metrics that capture both the agent generation
process and the performance of the generated agents, en-
abling comparison of system efficiency and output quality.
3.1. Workflow Selection
We evaluated our approach using ten deterministic work-
flows of varying complexity. The workflows were man-
ually constructed by the authors to reflect business pro-
cess automation tasks across multiple domains, including
e-commerce, cost optimisation, risk, and information re-
trieval. Although this workflow set was not derived from
an established benchmark, its construction was informed by
foundational business process modelling research. Specifi-
cally, we drew on research on business process families and
variants (Rosa et al., 2017; Delgado et al., 2022), process
model quality and comprehension (Mendling et al., 2010;
Figl, 2017), and representative BPMN model generation
(Skouradaki et al., 2016) to guide workflow diversity and
structural complexity.
The workflows were manually designed because we are not
aware of an established benchmark for evaluating the conver-
sion of BPMN-style workflows into executable agentic sys-
tems. Existing workflow datasets and benchmark resources
generally focus on process discovery, conformance check-
ing, event logs, or model analysis rather than end-to-end
evaluation of workflow-to-agent translation and execution
fidelity (van der Aalst & Carmona, 2022; IEEE Task Force
on Process Mining, 2025; Burattin, 2016). Table 1 in the
Appendix summarises each workflow, including the number
of nodes (tasks, gateways, and events) and edges (sequence
flows), which we use as indicators of structural complexity.
The workflows were selected according to two criteria. First,
they span a broad range of structural complexity, from 9
to 52 nodes, allowing evaluation across processes of dif-
ferent sizes and control-flow depth. Second, all workflows
are deterministic, in the sense that each execution path is
governed by predefined labels and conditions and yields a
directly specifiable expected outcome. This design lets us
isolate the core capability studied in this paper and evalu-
ate it systematically through exhaustive path coverage. We
acknowledge that author-constructed workflows may in-
troduce design bias and that restricting the evaluation to
deterministic processes limits generalisability, particularly
3
