---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Published as a workshop paper at SCALE - ICML 2026
Figure 1. Proposed System Architecture
with its GraphFlow controller, failed to autonomously gen-
erate the required files without manual agent wiring. FLOW
produced high-level task decompositions but not complete,
executable code. As none completed even a single work-
flow end-to-end, we excluded them from the comparative
evaluation, focusing on Roo and Cline as the only baselines
that successfully completed the tasks.
4.2. Evaluation Metrics
We evaluate each system across two tasks:
1. the agent generation process, and
2. the functional performance of the generated agents.
For each system under comparison (Roo, Cline and our
system), we generated at least 10 agents that successfully
compiled and executed according to the BPMN-defined
specifications for each of the ten workflows. Each of the 10
agents was then evaluated on a dataset comprising all possi-
ble combinations of control-flow flags, yielding comprehen-
sive test coverage across all execution paths. As summarised
in Table 1, the workflows vary in structural complexity from
9 nodes and 10 edges (Weather) to 52 nodes and 60 edges
(Cart), spanning diverse business domains. This diversity
ensures that our evaluation captures a wide range of real-
world scenarios, providing a robust testbed for assessing the
capabilities of each system in generating functional agents
from BPMN specifications.
Achieving the target of 10 successful agents per work-
flow per system required a total of 371 generation attempts
across all three systems, of which 300 succeeded and 71
failed outright. Our system and Cline each needed 117 at-
tempts to obtain their 100 successful agents (85.5% success
rate), while Roo required 137 attempts (73.0% success rate).
The 300 successful agents were collectively evaluated on
30,543 individual test cases (approximately 102 per run),
covering all possible control-flow paths in each workflow. A
generation attempt was classified as a failure when the cod-
ing agent was unable to produce a functional agent at all, for
example due to API errors, empty output, or code that could
not be executed end-to-end. This is distinct from repair iter-
ations (discussed in Section 4.2.1), where the agent initially
produced failing code but self-corrected after receiving error
feedback. Failure rates varied across workflows: simpler
workflows such as Social, Spam, and News were completed
without any failures by all three systems, whereas Weather
(46.4% failure rate; 56 attempts for 30 successes) and Tour-
nament (42.3%; 52 attempts) proved most challenging. To
assess cross-run consistency, we computed the coefficient
of variation (CV) of the Tool-Use Exactness score across
the 10 independent runs per workflow: our system exhibited
the lowest variability (CV = 0.63), followed by Cline (0.86)
and Roo (1.05), indicating that our approach produces more
consistent agents across independent generations.
4.2.1. AGENT GENERATION EVALUATION
The efficiency of the agent generation process was assessed
using two primary metrics: the number of repair iterations
and token usage.
1. Repair Iterations: We measured the number of re-
finement loops required to produce a valid agent. For
our system, this corresponds to the number of tool-
refinement cycles needed to achieve successful exe-
cution. For Roo and Cline, this includes code errors
and errors in the FastAPI service generated to invoke
the agent. Notably, our system’s templated approach
to developing a FastAPI service that wraps the agent
resulted in no errors in this category. We report this
as the average number of repair iterations required
to complete a single successful generation. Repairs
performed in generations where the task was not suc-
cessfully completed were not included.
2. Token Usage and Cost: We tracked the total num-
ber of tokens consumed from the initial invocation
5
