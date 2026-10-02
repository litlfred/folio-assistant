---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-002-background
section_title: "Background"
section_number: null
pages: 2-5
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Skill Definition
In this paper, we define a Skill as a reusable, file-system-based procedural package
for a class of agent tasks. Each Skill contains a required SKILL.md file with natural-language
instructions and may optionally include auxiliary resources such as scripts, templates, reference files,
or worked examples.
Skill Augmentation
We use Skill augmentation to refer to the inference-time mechanism by
which an agent harness makes relevant Skills available to an agent for solving a task. Compared
with other runtime augmentation paradigms, Skill augmentation is modular and reusable, provides
procedural guidance rather than factual context alone, can include executable resources, and is
cross-model portable because Skills are represented as files rather than model parameters (Table 1).
Agent Harness
An agent harness is the execution layer that wraps an LLM and connects it to
its environment [Lopopolo, 2026, Lee, 2026]. It exposes tools, manages files and workspace state,
executes scripts, returns observations, and, in Skill-augmented agents, discovers and loads relevant
Skills during inference.
Thus, a Skill is neither model weights nor an executable tool by itself; it becomes actionable through
a compatible harness that injects its instructions and exposes its resources.
2
Table 1: Comparison of runtime augmentation paradigms. Skills combine modular packaging,
procedural guidance, executable resources, and portability.
Prompts
RAG
Tools
Skills
Modular/reusable
×
✓
✓
✓
Procedural guidance
Limited
×
×
✓
Executable resources
×
×
✓
✓
Cross-model portable
✓
✓
✓
✓
Phase 1: Benchmark Construction
Skill Ecosystem
234,896
1,773,213
5,891
Deduplication
2,014,000 Unique Skills
Task Submissions
400
142
Tasks
Contributors
task.md
environment/
Dockerfile
Skills/
oracle/
verifier/
Phase 2: Quality Filtering
87 Tasks 8 Domains
Automated
Human Review
Structure
Oracle 100%
AI Detection
Leakage Audit
Data Validity
Task Realism
Oracle Quality
Skill Quality
Anti-Cheating
Phase 3: Evaluation
Task
Setup
[No Skills]
[With Skills]
[3 Trials]
Agent
Execution
OpenHands
Claude Code
Codex CLI
Gemini CLI
Verification & Results
Pass/Fail
18
9,396
Configurations
Trajectories
pytest
+16.6 pp with Skills
Figure 2: SKILLSBENCH pipeline overview. Construction aggregates 2,014,000 source-partitioned
Skills and 400 candidate task submissions from 142 contributors. Filtering applies automated checks
and human review, retaining an 87-task public evaluation aggregate across 8 domains. Evaluation
runs each task under matched Skill-access conditions across 18 model–harness configurations on
BenchFlow [BenchFlow team, 2026], producing 9,396 selected public result files.
3
SKILLSBENCH
A benchmark that measures Skill efficacy is only as credible as its filtering pipeline: if a Skill can
encode task-specific answers, the measurement collapses into instruction-following. SKILLSBENCH
therefore treats construction as part of the contribution. We define valid tasks, source candidates from
a vetted contributor community, and filter them through automated gates and human review. The
current evaluated inventory contains 87 tasks across 8 domains, drawn from 400 submissions by 142
contributors. Each task is a containerized unit with fixed data, an oracle solution, and a deterministic
verifier, evaluated under matched no-Skills and Skills-augmented conditions to isolate the Skill’s
contribution from the model–harness configuration.
Skills as expertise, not answers. SKILLSBENCH requires Skills to provide domain expertise for
a class of problems, never the solution to a specific instance. We enforce this in two ways. First,
contributors author Skills independently of the benchmark—from public repositories or prior domain
experience—so the experiment measures use of pre-existing expertise. Second, task instructions
never name which Skills to use; agents discover and activate Skills through the standard progressive-
disclosure mechanism [Anthropic, 2025a]. Without these constraints, a Skill becomes a hidden
answer key.
Task principles. Beyond the Skill boundary, every task must be authentic real work, verifiable by
deterministic pass/fail tests rather than LLM-as-a-judge [Wang et al., 2023b, Brown, 2025], difficult
because of the problem rather than artificial instruction confusion, and solvable end-to-end by an
oracle agent without pre-baked answers or hard-coded magic numbers. Instructions are human-
authored; if LLMs help refine wording, a human owns the final iteration. We reject classroom-style
tasks, made-up scenarios, toy datasets, and purely synthetic data.
3
SkillsBench task
Given to agent:
Curated skills bundle:
Withheld:
Container (Dockerfile)
Instruction
Input data & output sink
Expert-authored, reusable
Never named in instruction
Oracle solution
Verifier tests & labels
Condition A · no skills
instruction only · deterministic pytest · fraction
passed
rA
Condition B · curated skills
skills bundle mounted · same tests & tolerance ·
fraction passed
rB
Condition C · self-generated
authors its own skills · paired across arms ·
fraction passed
rC
CURATED LIFT
Δcurated = rB − rA
SELF-GEN LIFT
Δself = rC − rA
Figure 3: Anatomy of a SKILLSBENCH task. Each task ships with a containerized environment,
human-authored instruction, expert-curated Skills bundle, and withheld oracle/verifier/labels. The
arms differ only in Skill access (A: instruction alone; B: curated bundle mounted for the agent to
discover; C: the agent authors its own skill documents, then solves with them); one deterministic
pytest battery scores every arm as the fraction of checks passed, rA, rB, rC ∈[0, 1]. Skill efficacy:
∆curated = rB −rA, and ∆self = rC −rA against the same baseline.
Sourcing and filtering. We grew a 1,400-member contributor community, onboarded 200+ task
authors through scoping interviews, and ingested 400 candidate submissions from the public PR
history. Every PR clears four automated gates before human review: structural integrity, oracle
execution, instruction provenance (AI-text detector plus human label, yielding a 100% human-
authored release set), and Skill-to-solution leakage (rejecting task-specific filenames, paths, magic
numbers, verbatim oracle commands, or expected outputs). PRs that pass receive at least one 30-
minute maintainer review; tasks with no measurable separation between conditions are rejected as
low-signal. The current public evaluation aggregate retains 87 tasks; per-gate rejection counts and the
full rubric are in Appendix M.
Task specification. A SKILLSBENCH task is a self-contained module with four components (Fig-
ure 3), following the Agent Skills format [Anthropic, 2025a]: a human-authored instruction, a Docker
environment with task data and a skills/ subdirectory, an oracle reference solution that must pass
the verifier, and a deterministic pytest verifier. Each Skill folder uses the standard layout: a required
SKILL.md plus optional scripts, references, and assets.
Composition. The current task inventory contains 87 tasks across 8 domains (Figure 4), stratified by
estimated human-specialist completion time without AI assistance: 6 Core (<60 min), 53 Extended
(1–4 h), 28 Extreme (>4 h). Per-domain counts range from N = 5 to N = 16.
18%
16%
16%
16%
10%
9%
8%
6%
7%
61%
32%
87 tasks
SKILLSBENCH
Domain  (outer ring)
Software Engineering
16
Industrial & Physical Systems
14
Natural Science
14
Office & White Collar
14
Finance & Economics
9
Mathematics & OR
8
Cybersecurity
7
Media & Content Production
5
Difficulty  (inner ring)
Core
<60 min
6
Extended
1–4 h
53
Extreme
>4 h
28
Figure 4: SKILLSBENCH spans 8 domains (87 tasks total), weighted toward production workflows
rather than classroom problem sets. The inner ring shows the difficulty stratification; domain
definitions and the per-task mapping appear in Table 19.
4
4
