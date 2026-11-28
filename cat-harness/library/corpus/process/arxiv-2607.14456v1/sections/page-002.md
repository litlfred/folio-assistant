---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Published as a workshop paper at SCALE - ICML 2026
forms localised reasoning, making small, context-sensitive
adjustments within predefined steps rather than constructing
the full solution from first principles.
These systems usually require greater upfront effort because
the workflow must be manually designed and validated. This
makes them less suitable for short-lived use cases such as
demos or proof-of-concept experiments. However, they are
better suited to repeated or large-scale deployment. By pro-
ducing more consistent outputs, they can reduce technical
debt and simplify debugging and integration with external
systems. Their structured design also enables tighter context
management, allowing developers to control what informa-
tion is exposed to the LLM, reduce unnecessary token usage,
and improve performance at scale.
Recent studies show that although LLMs are increasingly
equipped with extended context windows, their utilisation
of this capacity remains uneven (An et al., 2025). Empirical
evidence also suggests that performance tends to degrade as
more of the context window is consumed (Modarressi et al.,
2025; Laban et al., 2025). To address this, we propose a
context management strategy that restricts the active con-
text to the minimum information required for each subtask.
In generalist systems, this is difficult because it requires
prior knowledge of the information needed for each sub-
task during workflow construction, and such designs are
often task-specific and do not transfer easily across domains.
Restricting context in this way can reduce redundancy and
improve model performance relative to systems that retain
excess context indiscriminately, as shown in Section 4.3.
Given that business processes can scale well beyond the
complexity of our benchmark workflows, effective context
management is critical for maintaining performance in large-
scale deployments.
Efficient context management also offers potential cost ben-
efits. This is especially important in business environments
where standard operating procedures may evolve frequently
during development and post-deployment phases and agen-
tic workflow generation tools may be executed repeatedly
for the same task. Under these conditions, reducing token
volume can yield substantial savings (Mei et al., 2025; La-
ban et al., 2025). While the per-instance reduction may
seem small, the cumulative impact at scale can be signifi-
cant. This creates value for specialist workflows that use
manually constructed context management to minimise the
information exposed to the LLM in a targeted way while
maintaining performance and reducing cost.
To operationalise these specialist workflows and the scoped
context they enable, we adopt a modular code generation ap-
proach in which the source of decomposition is external to
the model. Rather than discovering plans through prompts,
roles, or library modules as in prior multiagent systems (e.g.,
AutoGen, MetaGPT, DSPy, SWE-agent) (Wu et al., 2024;
Hong et al., 2024; Khattab et al., 2024; Yang et al., 2024),
we compile an industry standard BPMN 2.0 process model
into a ReAct style control graph. Each BPMN node provides
a typed tool contract and a node local policy, while the con-
trol plane enforces branches and joins, scopes context per
node, and applies contract derived runtime validation with
targeted retries. This specifications-to-agent compilation
yields an auditable workflow structure, minimises unnec-
essary context exposure, and avoids rediscovering plans at
runtime. The design is motivated by three principles: con-
strained execution via BPMN-derived control flow, targeted
context management that limits irrelevant information expo-
sure, and modular decomposition that supports more reliable
tool-level reasoning. Against this background, our study
examines whether a specialist BPMN-grounded workflow
can offer practical advantages over more generalist agentic
systems. The following sections describe how this design is
instantiated using BPMNs, outline the experimental method-
ology and benchmark design, and present results comparing
specialist and generalist agentic workflows.
1.1. Business Processes
To ground our study, we focus on business process au-
tomation and adopt BPMN as the structural representation
of workflows. BPMN is widely used in enterprise mod-
elling and provides a practical interface through which non-
technical users can specify process logic in a standardised
form (K¨opke & Safan, 2024; Nour Eldin et al., 2025; Toxtli
& Li, 2025; Berti et al., 2024). This makes it a suitable
domain for studying how LLM-based agentic systems can
transform human-authored process specifications into exe-
cutable workflows.
In this work, we consider the task of converting BPMN-
defined workflows into operational agentic pipelines. This
setting is appropriate for our comparison between specialist
and generalist systems because BPMN provides an explicit
and auditable representation of process structure, allow-
ing us to assess how effectively each approach preserves
intended workflow logic while supporting executable au-
tomation.
2. Literature Review
2.1. BPMN and Traditional Workflow Execution
Business Process Model and Notation (BPMN) is a standard
for modelling structured business workflows. Its graphical
notation is both human-readable and machine-executable,
which enables organisations to define, automate, and moni-
tor processes effectively (White, 2004; Chinosi & Trombetta,
2012; Dumas et al., 2018). Traditional BPMN engines op-
erate in deterministic, rule-based settings involving human
tasks, service calls, and decision gateways (Weske, 2019).
2
