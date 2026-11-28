---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-007
section_title: "Page 7"
pages: 7-7
pdf_page: 7
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Published as a workshop paper at SCALE - ICML 2026
Figure 2. Agent Generation Metrics: Repair Iterations, Token Usage (Input and Output) for the Specialist System(Custom), Roo, and
Cline.
the design principles outlined earlier in the paper: con-
strained execution via externally specified workflow struc-
ture, targeted context management, and modular decompo-
sition. Together, these reduce search space and planning
overhead, which in turn contributes to fewer tool-call errors
and more consistent execution across runs.
5. Conclusion
We presented a specialist agentic system for converting
BPMN-defined workflows into executable ReAct agents
and evaluated it against Cline and Roo across ten workflows
under the same foundation model. The specialist system
outperformed both baselines on all four evaluation metrics,
achieving higher tool-use exactness and process adherence,
substantially lower penalty-adjusted latency, and fewer tool-
call errors. It also reduced token consumption by more
than 95% relative to the generalist baselines and required
no repair iterations. These gains stem from decomposing
each workflow into modular prompt, tool, and orchestration
components, enabling constrained execution and targeted
context management rather than iterative trial-and-error gen-
eration.
These improvements are particularly valuable in enterprise
settings, where reliability, maintainability, and cost effi-
ciency are critical for large-scale deployment. By external-
ising workflow structure and reducing unnecessary context
exposure, specialist systems can offer a more predictable
and operationally manageable alternative to general-purpose
agentic coding assistants for structured automation tasks.
The evaluation is scoped to deterministic workflows under
realistic low-configuration usage. Although prompt engi-
neering or iterative tuning could improve generalist perfor-
mance, doing so would require additional user effort and
expertise. Future work will examine more heavily optimised
baseline configurations and conduct component-level abla-
tions to determine how each structural element contributes
to performance, and whether these components can be se-
lectively incorporated into generalist assistants.
7
