---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-080-execution-protocol
section_title: "Execution Protocol"
section_number: null
pages: 42-42
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
For the curated-Skills condition, task Skills are exposed before the task instruction using each
harness’s native loading mechanism. The task environment, input data, resource limits, and verifier
are otherwise identical across conditions. The agent interacts with the containerized environment
until it submits a final answer or artifact. The verifier then runs deterministic assertions and writes a
pass/fail result.
Selected rows first require a public result file, complete trajectory metadata, and a healthy verifier-
scored pass/fail outcome; timeout rows are used only as failure backfill when healthy replacements
are unavailable. Stale, rate-limited, or otherwise unscored runs are treated as incomplete coverage
and rerun rather than as benchmark outcomes. Container resources, retry policy, and orchestration
settings are summarized in Appendix D.
N.4
Scoring
The primary score is task-macro pass rate, following Terminal-Bench [Merrill et al., 2026]. For each
task t and condition c, we average the three selected public trials:
st,c = 1
3
3
X
i=1
rt,c,i.
where rt,c,i ∈[0, 1] is the deterministic verifier reward for trial i. We then average task scores over
the fixed set of 87 tasks:
PassRate(c) = 1
87
87
X
t=1
st,c.
The main no-Skills and curated-Skills conditions use this fixed three-trial denominator per task–
model pair. We report absolute improvement, ∆= PassRate(curated) −PassRate(no Skills), and
normalized gain:
g = PassRate(curated) −PassRate(no Skills)
1 −PassRate(no Skills)
.
Normalized gain measures proportional progress toward perfect performance, but it can overstate
small absolute gains near the ceiling. We therefore interpret g jointly with absolute pass-rate deltas.
The confidence intervals shown in Figure 1 use the binomial calculation described in Appendix G.
42
