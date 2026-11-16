---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-004
section_title: "Page 4"
pages: 4-4
pdf_page: 4
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Published as a workshop paper at SCALE - ICML 2026
to settings involving ambiguity, stochasticity, or open-ended
human decision making. The results should therefore be
interpreted as evidence for structured, deterministic process
settings rather than as a claim of universal representative-
ness.
3.2. Agentic System Design
Although these workflows could be executed using a fixed
Directed Acyclic Graph (DAG), and loops can be achieved
via LangGraph, we instead evaluate the ability of our system
to construct a ReAct-based solution (Yao et al., 2023b). A
ReAct agent conventionally plans actions and calls tools
through an interactive loop rather than following a strictly
predefined execution path. We chose this formulation for
three reasons:
1. Adaptability beyond fixed execution: ReAct agents
can generalise across a broader range of tasks and re-
spond more flexibly to changing execution conditions.
In practical settings such as customer service chat-
bots, workflows may require extracting information
from user messages, calling multiple tools, handling
corrected inputs, or revising earlier decisions. These
scenarios benefit from an agent that can re-plan during
execution rather than follow a rigid script (Leoc´adio
et al., 2024).
2. Scalability to realistic workflows: Compared with
static DAG execution, agent-based control is better
suited to workflows that extend beyond fixed linear
paths, particularly when user inputs, state changes, or
partial task completion require dynamic coordination
across steps.
3. Ease of authoring: The logic of a ReAct agent
is expressed in natural language through prompt in-
structions, which can make workflows easier for non-
technical subject matter experts to understand and mod-
ify. Minor changes to behaviour can therefore be made
by editing instructions rather than altering code, which
can speed up iteration and development.
3.3. Proposed System
Our proposed system (Figure 1) takes a BPMN-defined
workflow and API specifications and automatically gener-
ates a working ReAct-style agent through the following
steps:
1. Workflow Parsing: The BPMN diagram is parsed into
discrete steps, identifying tasks, decision nodes, and
required API calls. This yields a structured represen-
tation of the workflow logic (including branches and
conditions) that the language model can reason about.
2. API Service Generation: From the provided API spec-
ification, the system generates a reusable client module
that wraps external calls and abstracts low-level details,
reducing tool implementation complexity and code du-
plication.
3. Tool/Context Creation: Using the parsed workflow
steps and the API service, the system generates code
for each tool corresponding to a workflow node.
4. Iterative Refinement (Agent Self-Verification): Gen-
erated tool code is executed and validated against ex-
pected behaviour. On failure, the system enters a refine-
ment loop: the language model analyses the error and
revises the implementation. This loop continues until
execution succeeds or successive iterations cease to
make substantive progress. Each component is thereby
either validated or identified as unresolved.
5. Agent Assembly and Deployment: Once all tools
are verified, the system composes a natural language
prompt encoding the workflow logic and generates a
main function that instantiates the ReAct agent behind
a FastAPI service. The resulting system—prompts,
tools, and API endpoints—is then ready for end-to-end
testing.
4. Evaluations and Results
4.1. Baseline Systems and Experimental Setup
We evaluated our system against two automated coding
agents, Roo and Cline, available as Visual Studio Code ex-
tensions (Microsoft). All systems received identical BPMN
workflows, API specifications, and backend LLM. Roo and
Cline were allowed to operate unconstrained with their de-
fault approaches, as preliminary experiments showed that
imposing additional design constraints degraded output qual-
ity.
The base prompt is shown in Figure 5, where the
<BPMN> tags contain the raw BPMN 2.0 XML for each
workflow.
After each system declared completion, we conducted end-
to-end verification on sample inputs covering all workflow
branches. If an agent failed, we fed the error back and
allowed iterative self-repair until the issue was resolved or
the system could no longer make progress. Our system’s
agents passed all end-to-end tests on the first attempt without
manual intervention (Section 4.3.1), unlike those generated
by Roo and Cline.
We also evaluated AutoGen, MetaGPT, and FLOW (Wu
et al., 2024; Hong et al., 2024; Niu et al., 2025), but none
produced functional solutions for any workflow. MetaGPT’s
outputs were typically incomplete (e.g., generating only
prompts and tools but not the full agent). AutoGen, even
4
